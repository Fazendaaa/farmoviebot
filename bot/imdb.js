require( 'dotenv' ).config( { path: '../.env' } )
const Telegraf = require( 'telegraf' )
const imdb = require( 'imdb-api' );

const bot = new Telegraf( process.env.BOT_TOKEN )

bot.command('start', (ctx) => {
	console.log( 'start', ctx.from )
	ctx.reply( 'Welcome!' )
})

bot.command( 'search', (ctx) => {
	console.log( 'serach', ctx.from )
	const movie = ctx.message.text.split(' ').slice( 1 ).join(' ')

	imdb.get( movie ).then( data => {
		console.log( data ) 
		ctx.reply( data.imdburl )
	})
})

bot.startPolling()
