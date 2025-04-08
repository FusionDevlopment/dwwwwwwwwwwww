const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createTicket } = require('../utils/ticketUtils');
const config = require('../config.js');

const buttons = new Map();

// Load button handlers
function loadButtons(client) {
    // Bottoni di creazione ticket
    config.categories.forEach(category => {
        buttons.set(`ticket_create_${category.id}`, async (interaction) => {
            try {
                await interaction.deferReply({ ephemeral: true });

                // Crea il ticket direttamente
                const ticketChannel = await createTicket(
                    interaction.guild,
                    interaction.user,
                    category
                );

                if (!ticketChannel) {
                    await interaction.editReply({ 
                        content: 'Impossibile creare il ticket. Riprova o contatta un amministratore.',
                        ephemeral: true
                    });
                    return;
                }

                // Informa l'utente che il ticket è stato creato
                await interaction.editReply({ 
                    content: `Your ticket has been created: ${ticketChannel}`,
                    ephemeral: true
                });

            } catch (error) {
                console.error('Errore nella visualizzazione della conferma ticket:', error);
                await interaction.editReply({ 
                    content: error.message.includes('You already have 2 open tickets') ? error.message : 'Impossibile creare il ticket. Riprova o contatta un amministratore.', 
                    ephemeral: true 
                });
            }
        });
    });



    // Bottone per reclamare il ticket
    buttons.set('ticket_claim', async (interaction) => {
        try {
            const claimedEmbed = new EmbedBuilder()
                .setTitle('Ticket Reclamato')
                .setDescription(`Questo ticket è stato reclamato da ${interaction.user.toString()}`)
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.reply({ embeds: [claimedEmbed] });
        } catch (error) {
            console.error('Errore durante il reclamo del ticket:', error);
            await interaction.reply({ 
                content: 'Si è verificato un errore durante il reclamo di questo ticket.', 
                ephemeral: true 
            });
        }
    });

    // Bottone per chiudere il ticket
    buttons.set('ticket_close', async (interaction) => {
        try {
            const modal = {
                title: 'Chiudi Ticket',
                custom_id: 'ticket_close_modal',
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 4,
                                custom_id: 'close_reason',
                                label: 'Perché stai chiudendo questo ticket?',
                                style: 2,
                                min_length: 1,
                                max_length: 1000,
                                placeholder: 'Inserisci il motivo della chiusura del ticket...',
                                required: true
                            }
                        ]
                    }
                ]
            };

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Errore durante la visualizzazione del modal di chiusura ticket:', error);
            await interaction.reply({ 
                content: 'Si è verificato un errore durante l\'elaborazione della richiesta.', 
                ephemeral: true 
            });
        }
    });

    client.buttons = buttons;
}

// Gestisci le interazioni con i bottoni
async function handleInteraction(interaction, client) {
    const buttonId = interaction.customId;

    // Controlla se abbiamo un gestore per questo bottone
    const handler = buttons.get(buttonId);

    if (handler) {
        try {
            await handler(interaction, client);
        } catch (error) {
            console.error(`Errore nella gestione del bottone ${buttonId}:`, error);

            // Rispondi all'interazione se non l'abbiamo già fatto
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'Si è verificato un errore durante l\'elaborazione della richiesta.', 
                    ephemeral: true 
                });
            } else if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ 
                    content: 'Si è verificato un errore durante l\'elaborazione della richiesta.', 
                    ephemeral: true 
                });
            }
        }
    }
}

module.exports = {
    loadButtons,
    handleInteraction,
    buttons
};