const { REST, Routes } = require ("discord.js")

//.env
const dotenv = require('dotenv');
dotenv.config();
const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

//Importação de comandos
const fs = require ("node:fs")
const path = require ("node:path")

const commandPath = path.join(__dirname, "comandos")
const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith(".js"))

const commands = []

for (const file of commandFiles) {
    const command = require(`./comandos/${file}`)
    commands.push(command.data.toJSON())
}

//Instanciando Rest 
const rest = new REST({version: "10"}).setToken(TOKEN);

//
(async() => {
	try {
		console.log (`Resetando ${commands.length} comandos...`)
		const data = await rest.put (
			Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            {body: commands}
        )
        console.log ("Comandos Registrados com sucesso.")
	}
    catch (error) {
        console.error(error)
    }	
})()