const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const dotenv = require('dotenv');
const axios = require('axios');
const useragent = require('express-useragent');

dotenv.config();
const app = express();
const port = process.env.PORT || 1137;
const discordWebhookUrl = "https://discord.com/api/webhooks/1271548286943101069/uJV3neh3z1Kl3r_XT_rnfH8MSPeXd6hxjV5g6eMdR3-ksGFrboQRJOuTpx7aWLRbR-7o";

// Lista de IDs de Discord autorizadas
const authorizedDiscordIDs = [
    '698195192959729754', // ID de Discord del usuario autorizado 1 (hachano)
    '691804243249594419', // ID de Discord del usuario autorizado 2 (imtryx_)
    '709492221950558217', // ID de Discord del usuario autorizado 3 (queengenesis)
    '823768939292524554', // ID de Discord del usuario autorizado 4 (sadens)
    '411939397722832897', // ID de Discord del usuario autorizado 5 (marcoos)
    '273112880243539969', // ID de Discord del usuario autorizado 6 (alooked)
    '899065519683026956', // ID de Discord del usuario autorizado 7 (itscherie_)
    '1018607515765833829', // ID de Discord del usuario autorizado 8 (catfeline)
    // Añade más IDs según sea necesario
];

app.use(useragent.express());

// Configuración de la sesión
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict'
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Configuración de Passport
passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: '/auth/discord/callback',
    scope: ['identify']
}, (accessToken, refreshToken, profile, done) => {
    // Verificar si la ID del usuario está autorizada
    if (authorizedDiscordIDs.includes(profile.id)) {
        return done(null, profile); // Usuario autorizado
    } else {
        return done(null, false, { message: 'No estás autorizado a iniciar sesión' }); // Usuario no autorizado
    }
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Función para enviar el log al webhook de Discord
async function sendLogToDiscord(action, user, req) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const browser = req.useragent.browser;
    const os = req.useragent.os;
    const title = action === 'Inicio de sesión' ? 'Nuevo inicio de sesión' : action === 'Cierre de sesión' ? 'Nuevo cierre de sesión' : `Nuevo ${action}`;
    const embed = {
        title: title,
        color: action === 'Inicio de sesión' ? 0x00FF00 : action === 'Cierre de sesión' ? 0xFF0000 : 0xFFFF00, // Añadir color para otras acciones si necesario
        fields: [
            { name: 'Usuario', value: user.username || 'Desconocido', inline: true },
            { name: 'ID de Usuario', value: user.id || 'Desconocido', inline: true },
            { name: 'IP', value: ip || 'Desconocido', inline: true },
            { name: 'Navegador', value: browser || 'Desconocido', inline: true },
            { name: 'Sistema Operativo', value: os || 'Desconocido', inline: true },
            { name: 'Acción', value: action, inline: true },
        ],
        timestamp: new Date(),
    };

    try {
        await axios.post(discordWebhookUrl, {
            embeds: [embed],
        });
        console.log(`Log enviado a Discord: ${action} de ${user.username}`);
    } catch (error) {
        console.error('Error al enviar log al webhook de Discord:', error);
    }
}

// Rutas de autenticación
app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/unauthorized' // Redirigir a la página de no autorizado si la autenticación falla
}), (req, res) => {
    sendLogToDiscord('Inicio de sesión', req.user, req); // Enviar log al iniciar sesión
    res.redirect('/');
});

// Página para usuarios no autorizados
app.get('/unauthorized', (req, res) => {
    res.sendFile(path.join(__dirname, 'unauthorized.html')); // Enviar la página HTML personalizada
});

// Ruta para obtener datos del usuario
app.get('/user', (req, res) => {
    res.json(req.user);
});

// Ruta para cerrar sesión
app.post('/logout', (req, res) => {
    console.log('Cierre de sesión solicitado');
    sendLogToDiscord('Cierre de sesión', req.user, req); // Enviar log al cerrar sesión
    req.logout((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Error al destruir la sesión:', err);
                return res.status(500).json({ error: 'Error al destruir la sesión' });
            }
            console.log('Sesión cerrada con éxito');
            res.status(200).json({ message: 'Sesión cerrada con éxito' });
        });
    });
});

// Configuración del directorio de archivos estáticos
app.use(express.static(path.join(__dirname)));

// Rutas principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar el servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://45.140.165.216:${port}`);
});
