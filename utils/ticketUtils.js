const { 
    ChannelType, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const config = require('../config.js');

/**
 * Creates a ticket channel for the user with the specified category
 * @param {Guild} guild - The Discord guild
 * @param {User} user - The user creating the ticket
 * @param {Object} category - The ticket category configuration
 * @returns {TextChannel|null} - The created ticket channel or null if failed
 */
async function createTicket(guild, user, category) {
    try {
        // Find the corresponding Discord category
        const discordCategory = guild.channels.cache.find(
            c => c.type === ChannelType.GuildCategory && 
            c.name.toLowerCase() === category.label.toLowerCase()
        );

        // If the category doesn't exist, create it
        let parentChannel = discordCategory;
        if (!parentChannel) {
            try {
                parentChannel = await guild.channels.create({
                    name: category.label,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: guild.client.user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ManageChannels
                            ]
                        }
                    ]
                });
                console.log(`Created new category: ${category.label}`);
            } catch (error) {
                console.error('Error creating category:', error);
                return null;
            }
        }

        // Check if user already has open tickets
        const openTickets = guild.channels.cache.filter(channel =>
            channel.name.startsWith(`ticket-${user.username.toLowerCase().replace(/\s+/g, '-')}`) &&
            !channel.deleted // Added check for deleted channels
        ).size;

        if (openTickets >= 1) {
            throw new Error('Hai già un ticket aperto. Chiudi quello esistente prima di aprirne uno nuovo.');
        }


        // Create the ticket channel
        const ticketChannel = await guild.channels.create({
            name: `ticket-${user.username.toLowerCase().replace(/\s+/g, '-')}`,
            type: ChannelType.GuildText,
            parent: parentChannel.id,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                },
                {
                    id: guild.client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                }
            ]
        });

        // Add permissions for the staff role with specific ID
        const staffRoleID = '1358739007709777971';
        const staffRole = guild.roles.cache.get(staffRoleID);

        if (staffRole) {
            await ticketChannel.permissionOverwrites.create(staffRole, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
        } else {
            console.log('Staff role not found with ID: ' + staffRoleID);

            // Fallback to find staff role by name if ID not found
            const fallbackStaffRole = guild.roles.cache.find(r => 
                r.name.toLowerCase().includes('staff') || r.name.toLowerCase().includes('mod') || r.name.toLowerCase().includes('admin')
            );

            if (fallbackStaffRole) {
                await ticketChannel.permissionOverwrites.create(fallbackStaffRole, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });
            }
        }

        // Create welcome embed
        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`${category.emoji} ${category.label}`)
            .setDescription(`Thanks ${user.toString()} for opening a ticket. Our staff will assist you shortly.`)
            .setColor('#FF0000')
            .setThumbnail(config.embedThumbnail)
            .addFields({ name: 'Category', value: category.label })
            .setTimestamp()
            .setFooter({ text: ' Ticket System  - Knox Services' });

        // Create buttons for ticket management
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_claim')
                    .setLabel('Claim')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🙋'),
                new ButtonBuilder()
                    .setCustomId('ticket_close')
                    .setLabel('Close')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

        // Send the welcome message to the new ticket channel
        await ticketChannel.send({ 
            content: `${user.toString()} ${staffRole ? staffRole.toString() : ''}`,
            embeds: [welcomeEmbed],
            components: [row]
        });

        // Store ticket data in the client for transcript purposes
        if (!guild.client.ticketData) {
            guild.client.ticketData = new Map();
        }

        guild.client.ticketData.set(ticketChannel.id, {
            openerID: user.id,
            category: category,
            openedAt: new Date(),
            channelName: ticketChannel.name
        });

        // Incrementa il contatore dei ticket e aggiorna lo stato del bot
        guild.client.ticketCount++;

        // Aggiorna lo stato del bot
        if (typeof updateBotStatus === 'function') {
            updateBotStatus(guild.client);
        } else {
            guild.client.user.setActivity(`${guild.client.ticketCount} ticket`, { type: 'IDLE' });
        }

        console.log(`Ticket data stored for channel ${ticketChannel.id}: ${user.tag}, ${category.label}. Total tickets: ${guild.client.ticketCount}`);

        return ticketChannel;
    } catch (error) {
        console.error('Error in createTicket:', error);
        if (error.message.includes('You have alredu 2 ticket opened')) {
            throw error;
        }
        return null;
    }
}

module.exports = {
    createTicket
};