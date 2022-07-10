var bgsLogger = require('./bgsLogger.js');
var starad = require('./starad.js');

exports.registerCommands = async function(client, channel){

    console.log("Attempting to register " + Object.keys(bgsLogger.validTypes).length + " BGS logger options.");

    var bgsLoggerTypeChoices = [];
    for(const [key, value] of Object.entries(bgsLogger.validTypes)) {
        bgsLoggerTypeChoices.push({
            name: key,
            value: value
        });
    }

    const cmds = [
        {
            name: 'bgslog',
            description: 'Log your BGS contribution',
            defaultPermission: true,
            options: [
                {
                    name: 'faction',
                    type: 'STRING',
                    description: 'Faction the contribution was for',
                    required: true
                },
                {
                    name: 'system',
                    type: 'STRING',
                    description: 'System the contribution was in',
                    required: true
                },
                {
                    name: 'type',
                    type: 'STRING',
                    description: 'Type of contribution',
                    required: true,
                    choices: bgsLoggerTypeChoices
                },
                {
                    name: 'value',
                    type: 'STRING',
                    description: 'Value of contribution (e.g. 10,000,000, 10mil, 10m, 10k)',
                    required: true
                },
                {
                    name: 'location',
                    type: 'STRING',
                    description: 'Location at which this contribution occurred, if important (e.g. ground CZs)',
                    required: false
                },
                {
                    name: 'user',
                    type: 'STRING',
                    description: 'User who you are logging for',
                    required: false
                }
            ]
        },
        {
            name: 'cmdsetup',
            description: 'Command setup refresh',
            defaultPermission: false,
            permissions: [
                {
                    id: '250850608246947851',
                    type: 'USER',
                    permission: true,
                }
            ]
        },
        {
            name: 'starad',
            description: 'STARAD access and management',
            defaultPermission: true,
            options: [
                {
                    name: 'status',
                    type: 'SUB_COMMAND',
                    description: 'Current STARAD status report.'
                },
                {
                  name: 'traffic',
                  type: 'SUB_COMMAND',
                  description: 'Retrieve traffic information for SRLA controlled systems.'
                },
                {
                  name: 'run',
                  type: 'SUB_COMMAND',
                  description: 'Run a STARAD pass manually.'
                },
                {
                    name: 'supported',
                    type: 'SUB_COMMAND_GROUP',
                    description: 'Manage supported third-party factions.',
                    options: [
                        {
                            name: 'list',
                            type: 'SUB_COMMAND',
                            description: 'List supported third-party factions.'
                        },
                        {
                            name: 'add',
                            type: 'SUB_COMMAND',
                            description: 'Register a supported third-party faction.',
                            options: [
                              {
                                  name: 'faction',
                                  type: 'STRING',
                                  description: 'Faction to monitor.',
                                  required: true
                              },
                              {
                                  name: 'system',
                                  type: 'STRING',
                                  description: 'System(s) to monitor the faction in. If multiple, separate with commas.',
                                  required: true
                              },
                              {
                                  name: 'monitorinf',
                                  type: 'BOOLEAN',
                                  description: 'Whether to monitor for influence drops or just conflicts.',
                                  required: true
                              }
                            ]
                        },
                        {
                            name: 'remove',
                            type: 'SUB_COMMAND',
                            description: 'Unregister a supported third-party faction.',
                            options: [
                              {
                                  name: 'faction',
                                  type: 'STRING',
                                  description: 'Faction to unregister.',
                                  required: true
                              },
                              {
                                  name: 'system',
                                  type: 'STRING',
                                  description: 'System(s) to unregister the faction from. If multiple, separate with commas.',
                                  required: true
                              }
                            ]
                        }
                    ]
                }
            ]
        }
    ];

    for(cmd of cmds){
        var command = await client.guilds.cache.get('721872207239970866')?.commands.create(cmd);
        channel.send("Registered " + command.name + " command");
        console.log("Registered " + command.name + " command");
        if(cmd.permissions != undefined) {
            command.permissions.set({ permissions: cmd.permissions });
            console.log("  Set " + command.name + " permissions");
            channel.send("  Set " + command.name + " permissions");
        }
    }
}

function memStrToId(str){
    if(str.startsWith("<@!"))
        return str.substring(3, str.length - 1);
    
    return str.substring(2, str.length - 1);
}

exports.handleCommand = async function(Discord, client, interaction) {
    if(interaction.commandName == "cmdsetup") {
        this.registerCommands(client, interaction.channel);
        interaction.reply({content: "Command setup done.", ephemeral: true});
        return;
    }

    if(interaction.commandName == "bgslog") {
        var user = interaction.member.displayName;
        if(interaction.options.getString("user") != undefined){
            user = interaction.options.getString("user");

            if((user.startsWith("<@") || user.startsWith("<@!")) && user.endsWith(">")){
                var id = memStrToId(user);

                var gMem = await interaction.member.guild.members.fetch(id);
                if(gMem == undefined){
                    interaction.reply({content: `Could not fetch <@!${id}> as a guild member.`});
                    return;
                }

                user = gMem.displayName;
            }
        }

        var location = interaction.options.getString("location");

        bgsLogger.postLog(Discord, client, interaction, user, interaction.options.getString("faction"), interaction.options.getString("system"), interaction.options.getString("type"), interaction.options.getString("value"), location);

        return;
    }

    if(interaction.commandName == "starad") {
        starad.handleCommand(interaction);
        return;
    }
}
