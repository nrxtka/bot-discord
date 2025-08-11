require('dotenv').config();
const keepAlive = require('./server');
keepAlive();
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
    console.log(`✅ Bot login sebagai ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    try {
        // ========================
        // COMMAND /calculate
        // ========================
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'calculate') {
                await interaction.deferReply({ ephemeral: false });

                const embed = new EmbedBuilder()
                    .setTitle('Base weight calculator.')
                    .setDescription('Click a button below to start:')
                    .setColor(0x00AE86);

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('weight_calc')
                            .setLabel('Weight Calculator')
                            .setStyle(ButtonStyle.Primary)
                    );

                await interaction.editReply({ embeds: [embed], components: [row] });
            }
        }

        // ========================
        // TOMBOL → Modal Input
        // ========================
        if (interaction.isButton()) {
            if (interaction.customId === 'weight_calc') {
                const modal = new ModalBuilder()
                    .setCustomId('weight_form')
                    .setTitle('Base Weight Calculator');

                const ageInput = new TextInputBuilder()
                    .setCustomId('age')
                    .setLabel('Age (1-100)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const weightInput = new TextInputBuilder()
                    .setCustomId('weight')
                    .setLabel('Weight (Kg)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const firstRow = new ActionRowBuilder().addComponents(ageInput);
                const secondRow = new ActionRowBuilder().addComponents(weightInput);

                modal.addComponents(firstRow, secondRow);

                await interaction.showModal(modal);
            }
        }

        // ========================
        // SUBMIT MODAL → Hitung
        // ========================
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'weight_form') {
                await interaction.deferReply({ ephemeral: true });

                const age = parseInt(interaction.fields.getTextInputValue('age'));
                const weight = parseFloat(interaction.fields.getTextInputValue('weight'));

                // Gunakan multiplier 0.10 agar sesuai formula
                let multiplier = 0.10;

                // Hitung baseWeight dinamis sesuai input user
                let baseWeight = weight / (1 + multiplier * age);

                // Tentukan kategori
                let category = "Normal";
                let currentIdeal = baseWeight * (1 + multiplier * age);
                if (weight >= currentIdeal * 9) {
                    category = "Godly";
                } else if (weight >= currentIdeal * 8) {
                    category = "Titan";
                } else if (weight >= currentIdeal * 5) {
                    category = "Huge";
                }

                // Hasil ringkas setiap 10 usia
                const shortResults = [];
                const agesToShow = [1,10,20,30,40,50,60,70,80,90,100];
                for (const a of agesToShow) {
                    let w = baseWeight * (1 + multiplier * a);
                    shortResults.push(`Age ${a}: ${w.toFixed(2)} kg`);
                }


                const embed = new EmbedBuilder()
                    .setTitle('Pet Weight Calculator Results')
                    .setDescription(
                      // `**Pet Category:** ${category}\n\n` +
                        `Current Pet Data: Age ${age} | ${weight.toFixed(2)} kg\n` +
                       // `Base Weight (Age 1): ${baseWeight.toFixed(2)} kg\n\n` +
                        `**Weight Progression (per 10 age):**\n` +
                        `\`\`\`\n${shortResults.join('\n')}\n\`\`\``
                    )
                    .setColor(0x00AE86);

                const buttonRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`expand_${baseWeight}_${multiplier}_${category}`)
                            .setLabel('Expand')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await interaction.editReply({ embeds: [embed], components: [buttonRow] });
            }
        }

        // ========================
        // EXPAND → Full age 1-100
        // ========================
        if (interaction.isButton()) {
            if (interaction.customId.startsWith('expand_')) {
                await interaction.deferReply({ ephemeral: true });

                const [_, baseWeight, multiplier, category] = interaction.customId.split('_');
                const fullResults = [];
                for (let a = 1; a <= 100; a++) {
                    let w = parseFloat(baseWeight) * (1 + parseFloat(multiplier) * a);
                    fullResults.push(`Age ${a}: ${w.toFixed(2)} kg`);
                }

                const embed = new EmbedBuilder()
                    .setTitle('Pet Weight Calculator - Complete Results')
                    .setDescription(
                        `**Pet Category:** ${category}\n\n` +
                        `Complete Weight Progression:\n` +
                        `\`\`\`\n${fullResults.join('\n')}\n\`\`\``
                    )
                    .setColor(0x00AE86);

                await interaction.editReply({ embeds: [embed] });
            }
        }

    } catch (err) {
        console.error('❌ Error di interactionCreate:', err);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply('⚠️ Terjadi kesalahan saat memproses perintah.');
        } else {
            await interaction.reply({ content: '⚠️ Terjadi kesalahan saat memproses perintah.', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
