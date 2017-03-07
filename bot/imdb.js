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
	ctx.reply( welcome )
})

bot.command( 'help', ctx => {
	ctx.reply( help )
})

function removeCmd( ctx ) {
	return ctx.message.text.split(' ').slice( 1 ).join(' ')
}

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
	const movie = messageToString( removeCmd( ctx ) )

	imdb.get( movie ).then( response => ctx.reply( response.imdburl ) )
	.catch( reason => console.log( 'Reject promise in search: ', reason ) )
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

function inlineSearch( movie ) {
	return imdb.get( movie )
		   .then( response => replyInline( response ) )
		   .catch( reason => console.log( 'inlineSearch: ', reason ) )
}

bot.on( 'inline_query', ctx => {
	const movie = messageToString( ctx.inlineQuery.query ) || ''

	inlineSearch( movie )
	.then( response => ctx.answerInlineQuery( [ response ] ) )
} )

bot.startPolling( )