const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

/**
 * Crea un transcript HTML del canale del ticket
 * @param {TextChannel} channel - Il canale del ticket
 * @param {User} closer - L'utente che ha chiuso il ticket
 * @param {String} reason - La motivazione della chiusura
 * @param {Object} category - La categoria del ticket
 * @param {User} opener - L'utente che ha aperto il ticket
 * @returns {Promise<Object>} - Il percorso del file del transcript e il suo contenuto
 */
async function createTranscript(channel, closer, reason, category, opener) {
    try {
        // Crea la cartella per i transcript se non esiste
        const transcriptDir = path.join(__dirname, '..', 'transcripts');
        if (!fs.existsSync(transcriptDir)) {
            fs.mkdirSync(transcriptDir, { recursive: true });
        }

        // Prendi tutti i messaggi dal canale (fino a 100)
        const messages = await channel.messages.fetch({ limit: 100 });
        const messageArray = Array.from(messages.values()).reverse();

        // Crea l'HTML per il transcript
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transcript - ${channel.name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #2c2f33;
            color: #ffffff;
        }
        .header {
            border-left: 4px solid #3498db;
            padding: 10px;
            margin-bottom: 20px;
            background-color: #23272a;
            border-radius: 0 5px 5px 0;
            display: flex;
            align-items: center;
        }
        .header-logo {
            width: 48px;
            height: 48px;
            margin-right: 15px;
            border-radius: 50%;
        }
        .ticket-info {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #23272a;
            border-radius: 5px;
            border-left: 4px solid #3498db;
        }
        .message {
            margin-bottom: 10px;
            padding: 10px;
            background-color: #23272a;
            border-radius: 5px;
        }
        .user-tag {
            color: #3498db;
            font-weight: bold;
        }
        .timestamp {
            color: #7f8c8d;
            font-size: 12px;
        }
        .content {
            margin-top: 5px;
            word-break: break-word;
        }
        .bot-tag {
            background-color: #7289da;
            color: white;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 12px;
            margin-left: 5px;
        }
        .system-message {
            background-color: #3a3d41;
            border-left: 4px solid #f39c12;
        }
        h1 {
            color: #3498db;
        }
        .avatar {
            border-radius: 50%;
            width: 32px;
            height: 32px;
            margin-right: 10px;
            vertical-align: middle;
        }
        .message-header {
            display: flex;
            align-items: center;
        }
        .embed {
            border-left: 4px solid #3498db;
            padding: 8px;
            margin-top: 5px;
            background-color: #2f3136;
            border-radius: 0 3px 3px 0;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            color: #7f8c8d;
            padding: 10px;
            background-color: #23272a;
            border-radius: 5px;
            border-top: 1px solid #3498db;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .info-item {
            margin-bottom: 5px;
        }
        .info-label {
            font-weight: bold;
            color: #3498db;
        }
        .messages-container {
            max-height: 600px;
            overflow-y: auto;
            margin-bottom: 20px;
            padding: 10px;
            background-color: #2f3136;
            border-radius: 5px;
        }
        .feedback-button {
            display: inline-block;
            padding: 10px 15px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 10px;
            font-weight: bold;
        }
        .feedback-button:hover {
            background-color: #2980b9;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="https://cdn.discordapp.com/attachments/1357840435552190535/1357850845105881298/ChatGPT_Image_5_apr_2025__00_00_51-removebg-preview_1.png?ex=67f1b4a5&is=67f06325&hm=196649a5abb3854ba802f41413388fec78f8473a6c8c1829610cc33fcf92682c&">
        <h1>Fusion Portal - Transcript</h1>
    </div>
    
    <div class="ticket-info">
        <h2>Trascrizione del ticket</h2>
        <p>${channel.name}</p>
        <div class="info-grid">
            <div class="info-item"><span class="info-label">Chiuso da:</span> ${closer.tag || closer.username}</div>
            <div class="info-item"><span class="info-label">Motivazione Chiusura:</span> ${reason}</div>
            <div class="info-item"><span class="info-label">Categoria ticket:</span> ${category?.emoji || '❓'} ${category?.label || 'Sconosciuto'} ${category?.emoji || '❓'}</div>
            <div class="info-item"><span class="info-label">Aperto da:</span> ${opener.username}</div>
            <div class="info-item"><span class="info-label">ID Utente:</span> ${opener.id}</div>
        </div>
        <a href="https://forms.gle/your-form-link-here" class="feedback-button">Inoltra una recensione staff</a>
    </div>
    
    <div class="messages-container">`;

        // Aggiungi ogni messaggio al transcript
        for (const msg of messageArray) {
            const timestamp = new Date(msg.createdTimestamp).toLocaleString();
            const userTag = msg.author.tag;
            const userId = msg.author.id;
            const content = msg.content.replace(/\\n/g, '<br>');
            const avatarURL = msg.author.displayAvatarURL({ dynamic: true });
            
            html += `
        <div class="message ${msg.author.bot ? 'bot-message' : ''}">
            <div class="message-header">
                <img src="${avatarURL}" alt="Avatar" class="avatar">
                <span class="user-tag">${userTag}</span>
                ${msg.author.bot ? '<span class="bot-tag">BOT</span>' : ''}
                <span class="timestamp">${timestamp}</span>
            </div>
            <div class="content">${content || 'Nessun contenuto (possibile embed o allegato)'}</div>`;
            
            // Aggiungi embeds se presenti
            if (msg.embeds.length > 0) {
                for (const embed of msg.embeds) {
                    html += `
            <div class="embed">
                ${embed.title ? `<strong>${embed.title}</strong><br>` : ''}
                ${embed.description ? `${embed.description}<br>` : ''}
            </div>`;
                }
            }
            
            html += `
        </div>`;
        }

        html += `
    </div>
    
    <div class="footer">
        <p>Fusion Portal | ${new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}</p>
    </div>
</body>
</html>`;

        // Salva il transcript come file HTML
        const fileName = `ticket-${opener.username.toLowerCase().replace(/\\s+/g, '-')}.html`;
        const filePath = path.join(transcriptDir, fileName);
        fs.writeFileSync(filePath, html);

        return {
            filePath,
            fileName,
            content: html
        };
    } catch (error) {
        console.error('Errore nella creazione del transcript:', error);
        return null;
    }
}

/**
 * Invia il transcript a un canale specificato e all'utente in DM
 * @param {Client} client - Il client Discord
 * @param {User} user - L'utente che ha aperto il ticket
 * @param {Object} transcriptData - I dati del transcript
 * @param {TextChannel} channel - Il canale del ticket
 * @param {User} closer - L'utente che ha chiuso il ticket
 * @param {String} reason - La motivazione della chiusura
 * @param {Object} category - La categoria del ticket
 * @returns {Promise<void>}
 */
async function sendTranscript(client, user, transcriptData, channel, closer, reason, category) {
    try {
        if (!transcriptData) return;

        // Crea l'allegato con il file HTML
        const attachment = new AttachmentBuilder(transcriptData.filePath, { name: transcriptData.fileName });

        // Crea l'embed per il transcript
        const embed = new EmbedBuilder()
            .setTitle('Knox Services - Transcript')
            .setDescription(`Trascrizione del ticket\n${channel.name}`)
            .addFields(
                { name: 'Closed By:', value: `${closer.username}`, inline: true },
                { name: 'Reason for Closing:', value: reason, inline: true },
                { name: 'Category ticket:', value: `${category?.emoji || '❓'} ${category?.label || 'Sconosciuto'} ${category?.emoji || '❓'}`, inline: true },
                { name: 'Opened By:', value: user.username, inline: true },
                { name: 'ID User:', value: user.id, inline: true }
                
            )
            .setColor('#FF0000')
            .setTimestamp()
            .setFooter({ text: 'Knox Services', iconURL: client.user.displayAvatarURL() });

        // Ottieni il canale per i transcript dall'ID
        const transcriptChannel = await client.channels.fetch('1358739086860357642').catch(e => {
            console.error('Errore nel trovare il canale dei transcript:', e);
            return null;
        });

        // Invia il transcript al canale specificato
        if (transcriptChannel) {
            await transcriptChannel.send({
                embeds: [embed],
                files: [attachment]
            });
        }

        // Tenta di inviare il transcript in DM all'utente
        try {
            await user.send({
                content: 'Here is the transcript of your ticket:',
                embeds: [embed],
                files: [attachment]
            });
        } catch (error) {
            console.error('Impossibile inviare DM all\'utente:', error);
            // Non interrompere il flusso se il DM fallisce
        }

        // Elimina il file temporaneo
        fs.unlinkSync(transcriptData.filePath);
    } catch (error) {
        console.error('Errore nell\'invio del transcript:', error);
    }
}

module.exports = {
    createTranscript,
    sendTranscript
};