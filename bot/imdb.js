require( 'dotenv' ).config( { path: '../.env' } )

const Telegraf = require( 'telegraf' )
const imdb = require( 'imdb-api' )
const bot = new Telegraf( process.env.BOT_TOKEN )

const welcome = "Welcome to IMDB bot.\n\nType:\n/help"
const help = "Usage:\n\n/search \'movie name\'\n/source -- see the code behind\
			  IMDBbot\n\nAny bugs or suggestions, talk to: @farm_kun"

bot.command( 'start', ctx => {
	console.log( 'start', ctx.from )
	ctx.reply( welcome )
})

bot.command( 'help', ctx => {
	console.log( 'help', ctx.from )
	ctx.reply( help )
})

/*	It's  not a pretty function, but when is typed 'gantz:o', :o turns out to be
	a  emoji.  Or  when  typed 'gantz:0', the IMDB API return 'gantz' only, they
	have to be 'gantz:o'
*/
function messageToString( message ) {
	return Buffer
		  .from( message, 'ascii' )
		  .toString( 'ascii' )
		  .replace( /(?:=\(|:0|:o|: o|: 0)/, ': o' )
}

bot.command( 'search', ctx => {
	const movie = messageToString( ctx.message.text.
								   split(' ').slice( 1 ).join(' ') )

	imdb.get( movie ).then( response => ctx.reply( response.imdburl ) )
	.catch( console.log( 'Reject promise in search function' ) )
} )

bot.command( 'source', ctx => {
	ctx.reply( 'https://github.com/Fazendaaa/imdb_bot_telegram' )
})

function inline_search( movie, callback ) {
	const inline = [ ]

	imdb.get( movie )
	.then( response => {
			inline.push( {
				id: response.title,
				title: response.title,
				type: 'article',
				input_message_content: {
					message_text: response.imdburl,
					parse_mode: 'HTML'
				},
				url: response.url,
				description: response.plot,
				thumb_url: response.poster
				}
			)
		callback( inline )
	} )
	.catch( console.log( 'Reject promise in inline search function' ) )
}

bot.on( 'inline_query', ctx => {
	const movie = messageToString( ctx.inlineQuery.query ) || ''

	inline_search( movie, response => {
		ctx.answerInlineQuery( response )
	} )
} )

bot.startPolling( )