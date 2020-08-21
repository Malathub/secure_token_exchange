const Discord = require("discord.js");
const config = require("../config.json")
var settings = require("../isAlreadyExchanging")

var embed_token_invalid = new Discord.MessageEmbed()
    .setTitle(`**:x: Le token est invalide ou a expiré**`)
    .setDescription("Il se peut que votre bot ait été banni par discord, ou vous deviez allez rechercher un nouveau token dans l'linterface développeur de Discord")
    .setColor("RED")

var embed_pub_time_stop = new Discord.MessageEmbed()
    .setTitle(`**:x: Temps écoulé**`)
    .setFooter("Le delai imparti pour l'étape en cours est expiré")
    .setColor("RED")

var embed_pubing = new Discord.MessageEmbed()
    .setTitle(`**:x: Un échange est déjà en cours**`)
    .setDescription("Interrompez l'échange en cours.")
    .setColor("RED")

    var testToken = {};

module.exports.run = async (client, message, args) => {
    if(settings.exchanging[message.author.id] == true) return message.channel.send(embed_pubing)

    if(!message.mentions.members.first()) return message.channel.send("Vous devez mentionnez la personne avec qui faire l'échange")
    let target = message.mentions.members.first()

    if(!target) return message.channel.send("La personne n'est pas présente sur le serveur")

    if(target.user.id) return message.channel.send("La personne n'est pas présente sur le serveur")

    settings.exchanging[message.author.id] = true;

    const authorFilter = m => m.author.id == message.author.id;
    const targetFilter = m => m.author.id == target.user.id;

    let authorExchange;
    try{
        authorExchange = await message.author.send(new Discord.MessageEmbed()
            .setTitle(`Échange sécurisé avec ${target.user.tag}`)
            .setDescription("Veuillez entrer votre token.")
            .setFooter("Vous avez 60 secondes")
            .setColor("RED"))


        message.channel.send("Vous avez reçu un message privé pour commencez votre échange")
    } catch(err){
        message.channel.send("Vous devez autoriser les messages privé !")
        settings.exchanging[message.author.id] = false;
    }

    authorExchange.channel.awaitMessages(authorFilter, { max: 1, time: 60000, errors: ['time'] })
                        .then(async collected => {
                            if(message.author.bot) return;
                            const authorToken = collected.first().content
                            if(authorToken === ""){
                                message.author.send(embed_token_invalid);
                                settings.exchanging[message.author.id] = false;
                                return;
                            }

                            testToken[message.author.id] = new Discord.Client({fetchAllMembers: true});
                            testToken[message.author.id].login(authorToken).catch(err => {
                                message.author.send(embed_token_invalid)
                                settings.exchanging[message.author.id] = false;
                            })

                            let authorBottag;
                            let authorBotmemberCount;
                            let authorBotserverCount;

                            testToken[message.author.id].on("ready", async () => {
                                authorBottag = testToken[message.author.id].user.tag;
                                authorBotmemberCount = testToken[message.author.id].users.cache.size;
                                authorBotserverCount = testToken[message.author.id].guilds.cache.size;

                                let targetExchangeAccept;
                                try{
                                    targetExchangeAccept = await target.send(new Discord.MessageEmbed()
                                        .setTitle(`Demande d'échange reçu de ${message.author.tag}`)
                                        .setDescription(`Voulez vous acceptez ? \n __Information du token:__ \n \n __Tag:__ ** ${authorBottag} ** \n __membres:__ ** ${authorBotmemberCount} ** \n __Serveurs:__ ** ${authorBotserverCount} **`)
                                        .setFooter("Vous avez 60 secondes")
                                        .setColor("RED"))
                                        
                                        targetExchangeAccept.react("✅")
                                        targetExchangeAccept.react("❌")
                            
                            
                                    message.author.send("Demande envoyé, le destinataire a 5 minutes pour répondre.")
                                } catch(err){
                                    message.author.send("Le destinataire a bloqué ses messages privé")
                                    settings.exchanging[message.author.id] = false;
                                }

                                const ReactfilterTarget = (reaction, user) => {
                                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === target.id;
                                };

                                const ReactfilterAuthor = (reaction, user) => {
                                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                                };

                                targetExchangeAccept.awaitReactions(ReactfilterTarget, { max: 1, time: 300000, errors: ['time'] })
                                .then(async collected => {
                                    if(message.author.bot) return;
                                    const reaction = collected.first();
                                        let targetExchange;
                                    if (reaction.emoji.name === '✅') {
                                        message.author.send("Le destinataire a acceptez votre échange")
                                        message.author.send("En attente des données")

                                        targetExchange = await reaction.message.channel.send(new Discord.MessageEmbed()
                                        .setTitle(`Échange sécurisé avec ${message.author.tag}`)
                                        .setDescription("Veuillez entrer votre token.")
                                        .setFooter("Vous avez 60 secondes")
                                        .setColor("RED"))
                                        
                                        targetExchange.channel.awaitMessages(targetFilter, { max: 1, time: 60000, errors: ['time'] })
                                        .then(async collected => {
                                            
                                            if(message.author.bot) return;
                                            const targetToken = collected.first().content
                                            if(targetToken === ""){
                                                target.send(embed_token_invalid);
                                                settings.exchanging[message.author.id] = false;
                                                return;
                                            }

                                           
                                            testToken[reaction.message.channel.id] = new Discord.Client({fetchAllMembers: true});
                                            testToken[reaction.message.channel.id].login(targetToken).catch(err => {
                                            reaction.message.channel.send(embed_token_invalid)
                                            settings.exchanging[message.author.id] = false;
                                        })


                                            testToken[reaction.message.channel.id].on("ready", async () => {
                                                let targetBottag = await testToken[reaction.message.channel.id].user.tag;
                                                let targetBotmemberCount = await testToken[reaction.message.channel.id].users.cache.size;
                                                let targetBotserverCount = await testToken[reaction.message.channel.id].guilds.cache.size;

                                                reaction.message.channel.send("Votre proposition à été envoyée.")

                                            let lastStep = await message.author.send(new Discord.MessageEmbed()
                                            .setTitle(`Proposition reçus de ${target.user.tag}`)
                                            .setDescription(`Voulez vous acceptez ? \n __Information du token:__ \n \n __Tag:__ ** ${targetBottag} ** \n __membres:__ ** ${targetBotmemberCount} ** \n __Serveurs:__ ** ${targetBotserverCount} **`)
                                            .setFooter("Vous avez 60 secondes")
                                            .setColor("RED"))

                                            lastStep.react("✅")
                                            lastStep.react("❌")

                                            lastStep.awaitReactions(ReactfilterAuthor, { max: 1, time: 300000, errors: ['time'] })
                                            .then(async collected => {
                                                if(message.author.bot) return;
                                                const reactionn = collected.first();
                                                    let targetExchange;
                                                if (reactionn.emoji.name === '✅') {
                                                    message.author.send(new Discord.MessageEmbed()
                                                        .setTitle("Échange accepté")
                                                        .setDescription(`Voici le token: ${targetToken}`)
                                                    )

                                                    reaction.message.channel.send(new Discord.MessageEmbed()
                                                        .setTitle("Échange accepté")
                                                        .setDescription(`Voici le token: ${authorToken}`)
                                                    )
                                                }

                                                if (reactionn.emoji.name === '❌') {
                                                    reaction.message.channel.send("L'utilisateur a refusé votre échange")
                                                    settings.exchanging[message.author.id] = false;
                                                }
                                            }).catch(collected => {
                                                message.channel.send(embed_pub_time_stop)
                                                settings.exchanging = false;
                                            })
                                                
                                            })


                                        }).catch(collected => {
                                            message.author.send(embed_pub_time_stop)
                                            settings.exchanging = false;
                                        })
                                    }

                                    if (reaction.emoji.name === '❌') {
                                        message.author.send("Le destinataire a refusé votre échange")
                                        settings.exchanging[message.author.id] = false;
                                    }
                                }).catch(collected => {
                                    message.author.send(embed_pub_time_stop)
                                    settings.exchanging = false;
                                })
                                


                            })
                            

                        }).catch(collected => {
                            message.author.send(embed_pub_time_stop)
                            settings.exchanging = false;
                        })

    
}

module.exports.help = {
    name: "exchange"
}