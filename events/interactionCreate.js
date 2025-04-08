const buttonHandler = require('../handlers/buttonHandler');
const modalHandler = require('../handlers/modalHandler');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            // Handle button interactions
            if (interaction.isButton()) {
                await buttonHandler.handleInteraction(interaction, client);
                return;
            }
            
            // Handle modal submissions
            if (interaction.isModalSubmit()) {
                await modalHandler.handleInteraction(interaction, client);
                return;
            }

            // Handle slash commands if implemented
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                
                if (!command) {
                    console.error(`No command matching ${interaction.commandName} was found.`);
                    return;
                }
                
                try {
                    await command.execute(interaction, client);
                } catch (error) {
                    console.error(`Error executing ${interaction.commandName}:`, error);
                    
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
                    }
                }
            }
        } catch (error) {
            console.error('Error in interaction handler:', error);
        }
    },
};
