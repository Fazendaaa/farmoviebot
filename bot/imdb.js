const Telegraf = require( 'telegraf' )
const token = require( './token.js' )
const imdb = require( 'imdb-api' );

const bot = new Telegraf( token )

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
