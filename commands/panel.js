const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.js');

module.exports = {
    data: {
        name: 'panel'
    },
    async execute(message, args, client) {
        // Check for permissions
        if (!message.member.permissions.has('ManageChannels')) {
            return message.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
        }

        try {
// Create the main embed
const embed = new EmbedBuilder()
    .setTitle('Knox Services - Ticket')
    .setDescription('✉ **Click the button to open a ticket !**')
    .setColor('#FF0000')
    .setTimestamp()
    .setFooter({ text: 'Knox Services - Ticket System', iconURL: message.guild.iconURL() })
    .setImage('https://cdn.discordapp.com/attachments/1316496497298243648/1358149337254723644/ChatGPT_Image_5_apr_2025_12_24_18_1.png?ex=67f2caa3&is=67f17923&hm=b71fd54d37cbbcfd5405316286e17cbb080afabd1cf06c7c9f20bb0a3f1fd718&'); // Aggiungi qui l'URL dell'immagine



            // Create up to 5 rows with up to 5 buttons each (max 25 components)
            // We'll limit to 3 rows of 4 buttons (12 total categories)
            const rows = [];
            let currentRow = new ActionRowBuilder();
            let buttonCount = 0;

            for (const category of config.categories) {
                // If we've hit 4 buttons in this row, push it and start a new one
                if (buttonCount > 0 && buttonCount % 4 === 0) {
                    rows.push(currentRow);
                    currentRow = new ActionRowBuilder();
                }

                const button = new ButtonBuilder()
                    .setCustomId(`ticket_create_${category.id}`)
                    .setLabel(category.label)
                    .setEmoji(category.emoji)
                    .setStyle(ButtonStyle.Secondary);

                currentRow.addComponents(button);
                buttonCount++;
            }

            // Push the last row if it has any buttons
            if (currentRow.components.length > 0) {
                rows.push(currentRow);
            }

            await message.channel.send({ embeds: [embed], components: rows });
            await message.delete().catch(e => console.error('Could not delete command message:', e));
        } catch (error) {
            console.error('Error in panel command:', error);
            return message.reply({ content: 'There was an error creating the ticket panel!', ephemeral: true });
        }
    }
};
