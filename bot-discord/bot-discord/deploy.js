require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('calculate')
        .setDescription('Start pet calculator')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID), // GLOBAL COMMAND
            { body: commands }
        );
        console.log('✅ Command global berhasil didaftarkan');
    } catch (error) {
        console.error(error);
    }
})();
