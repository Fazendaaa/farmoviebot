require( 'dotenv' ).config( { path: '../.env' } )
const Telegraf = require( 'telegraf' )
const imdb = require( 'imdb-api' )
const bot = new Telegraf( process.env.BOT_TOKEN )

const welcome = "Welcome to IMDB bot. Type:\n/help"
const help = "Usage:\n\n/search \'movie name\'\n/source -- see the code behind IMDBbot\n\nIt\'s only working in command so far, the next update it will have inline mode.\nAny bugs or suggestions, talk to: @farm_kun"

bot.command( 'start', (ctx) => {
	console.log( 'start', ctx.from )
	ctx.reply( welcome )
})

bot.command( 'help', (ctx) => {
	console.log( 'help', ctx.from )
	ctx.reply( help )
})

function search( movie, callback ) {
	imdb.get( movie, ( err, data ) => {
		return callback( data )
	} )
}

bot.command( 'search', (ctx) => {
	const movie = ctx.message.text.split(' ').slice( 1 ).join(' ')
	search( movie, response => {
  						ctx.reply( response.imdburl )
  					}
  		  )
})

bot.command( 'source', (ctx) => {
	ctx.reply( 'https://github.com/Fazendaaa/imdb_bot_telegram' )
})

/*
bot.on( 'inline_query', (ctx) => {
  const movie = ctx.inlineQuery.query || ''
  search( movie, function( response ) {
  						return ctx.answerInlineQuery( [
	  						{
						        id: response.name,
						        title: response.name,
						        type: 'article',
						        input_message_content: {
						        	message_text: response.imdburl
						        }
	  						}
  						] )
  					}
  		  )
} )
*/

bot.startPolling()