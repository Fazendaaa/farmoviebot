require( 'dotenv' ).config( { path: '../.env' } )
const Telegraf = require( 'telegraf' )
const imdb = require( 'imdb-api' );

const bot = new Telegraf( process.env.BOT_TOKEN )
const welcome = 'Welcome to IMDB bot.\
				\
				Type:\
					/help'
const help = 'Usage:\
				/search \'movie name\'\
			\
			It\'s only working in command so far, the next update it will\
			have inline mode.\
			\
			Any bugs or suggestions, talk to: @farm_kun'

bot.command('start', (ctx) => {
	console.log( 'start', ctx.from )
	ctx.reply( welcome )
})

bot.command('help', (ctx) => {
	console.log( 'help', ctx.from )
	ctx.reply( help )
})

bot.command( 'search', (ctx) => {
	const movie = ctx.message.text.split(' ').slice( 1 ).join(' ')

	imdb.get( movie ).then( data => {
		console.log( data ) 
		ctx.reply( data.imdburl )
	})
})

bot.startPolling()
