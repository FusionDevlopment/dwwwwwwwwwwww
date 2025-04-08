const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { createTranscript, sendTranscript } = require('../utils/transcriptUtils');

// Gestione degli invii dei modali
async function handleInteraction(interaction, client) {
    const modalId = interaction.customId;
    
    // Gestione del modale di chiusura ticket
    if (modalId === 'ticket_close_modal') {
        try {
            await interaction.deferReply();
            
            // Ottieni il motivo della chiusura dal modale
            const closeReason = interaction.fields.getTextInputValue('close_reason');
            
            // Crea l'embed di chiusura
            const closingEmbed = new EmbedBuilder()
                .setTitle('Ticket Chiuso')
                .setDescription(`Questo ticket è stato chiuso da ${interaction.user.toString()}`)
                .addFields(
                    { name: 'Motivazione', value: closeReason }
                )
                .setColor('#FF0000')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [closingEmbed] });
            
            // Ottieni il nome del canale per estrarre l'ID dell'utente che ha aperto il ticket
            const channelName = interaction.channel.name;
            
            // Verifica se ticketData è disponibile
            if (!client.ticketData) {
                client.ticketData = new Map();
            }
            
            // Variabili per il transcript
            let opener;
            let category;
            let transcriptData;
            
            // Ottieni i dati del ticket
            const ticketData = client.ticketData.get(interaction.channel.id);
            
            if (!ticketData) {
                console.log(`Dati del ticket non trovati per il canale ${interaction.channel.id}. Nome canale: ${channelName}`);
                
                // Cerca di estrarre l'username dal nome del canale
                const usernameMatch = channelName.match(/ticket-(.+)/);
                let openerId = null;
                
                category = { 
                    label: 'Sconosciuto', 
                    emoji: '❓', 
                    color: '#cccccc'
                };
                
                // Cerca l'utente tramite il nome utente estratto dal nome del canale
                if (usernameMatch && usernameMatch[1]) {
                    const username = usernameMatch[1];
                    const possibleOpeners = await interaction.guild.members.fetch()
                        .then(members => members.filter(m => m.user.username.toLowerCase() === username.toLowerCase()))
                        .catch(() => null);
                    
                    if (possibleOpeners && possibleOpeners.size > 0) {
                        openerId = possibleOpeners.first().id;
                    }
                }
                
                if (!openerId) {
                    await interaction.channel.send({
                        content: 'Impossibile trovare i dati del ticket. Il transcript sarà generato con informazioni limitate.'
                    });
                    
                    // Fallback: usa l'utente che ha chiuso il ticket
                    openerId = interaction.user.id;
                }
                
                // Crea un opener
                opener = await client.users.fetch(openerId).catch(e => interaction.user);
                
                await interaction.channel.send({
                    content: 'Generazione del transcript in corso con informazioni limitate...'
                });
            } else {
                // Ottieni l'utente che ha aperto il ticket dai dati del ticket
                opener = await client.users.fetch(ticketData.openerID).catch(e => interaction.user);
                category = ticketData.category;
                
                await interaction.channel.send({
                    content: 'Generazione del transcript in corso...'
                });
            }
            
            // Genera il transcript
            transcriptData = await createTranscript(
                interaction.channel,
                interaction.user,
                closeReason,
                category,
                opener
            );
            
            if (transcriptData) {
                // Invia il transcript al canale dei log e all'utente che ha aperto il ticket
                await sendTranscript(
                    client,
                    opener,
                    transcriptData,
                    interaction.channel,
                    interaction.user,
                    closeReason,
                    category
                );
                
                await interaction.channel.send({
                    content: 'Transcript generato e inviato con successo!'
                });
            } else {
                await interaction.channel.send({
                    content: 'Errore nella generazione del transcript!'
                });
            }
            
            // Invia un messaggio che il canale verrà eliminato
            await interaction.channel.send({
                content: 'Questo ticket verrà eliminato in 5 secondi...'
            });
            
            // Attendi 5 secondi, poi elimina il canale
            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (error) {
                    console.error('Errore nell\'eliminazione del canale del ticket:', error);
                    await interaction.channel.send({
                        content: 'Impossibile eliminare questo canale. Chiedere a un amministratore di eliminarlo manualmente.'
                    });
                }
            }, 5000);
            
        } catch (error) {
            console.error('Errore nella chiusura del ticket:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'Si è verificato un errore durante la chiusura di questo ticket.', 
                    ephemeral: true 
                });
            } else if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ 
                    content: 'Si è verificato un errore durante la chiusura di questo ticket.', 
                    ephemeral: true 
                });
            }
        }
    }
}

module.exports = {
    handleInteraction
};
