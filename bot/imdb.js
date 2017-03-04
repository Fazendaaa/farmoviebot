require( 'dotenv' ).config( { path: '../.env' } )

const Telegraf = require( 'telegraf' )
const imdb = require( 'imdb-api' )
const bot = new Telegraf( process.env.BOT_TOKEN )

const welcome = "Welcome to IMDB bot.\n\nType:\n/help"
const help = "Usage:\n\n\
@IMDBdbot 'movie name'\n\
/search \'movie name\'\n\
/source -- see the code behind IMDBbot\n\n\
Any bugs or suggestions, talk to: @farm_kun"

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
	.catch( reason => {
		console.log( 'Reject promise in search: ', reason ) 
	})
} )

bot.command( 'source', ctx => {
	ctx.reply( 'https://github.com/Fazendaaa/imdb_bot_telegram' )
})

function replyInline( data ) {
	return {
		id: data.title,
		title: data.title,
		type: 'article',
		input_message_content: {
			message_text: data.imdburl,
			parse_mode: 'HTML'
		},
		url: data.url,
		description: data.plot,
		thumb_url: data.poster
	}
}

function inlineSearch( movie, callback ) {
	const inline = [ ]

	Promise.all( [ movie ].concat( movie.split( /(?::|-|\s)/ ) )  )
	.then( variations => {
		for( var i = variations.length - 1; i >= 0; i-- ) {
			imdb.get( variations[ i ] )
			.then( response => { 
				inline.push( replyInline( response ) )
				callback( inline )
			} )
			.catch( reason => { 
				console.log( 'Reject promise inline search:', reason )
			} )
		}
	} )
	.catch( reason => {
		console.log( 'Reject promise all: ', reason )
	} )
}

bot.on( 'inline_query', ctx => {
	const movie = messageToString( ctx.inlineQuery.query ) || ''

	inlineSearch( movie, response => {
		console.log( response )
		ctx.answerInlineQuery( response )
	} )
} )

bot.startPolling( )