require( 'dotenv' ).config( { path: '../.env' } )

const Telegraf = require( 'telegraf' )
const imdb = require('imdb-search')
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

	imdb.search( movie ).then( response =>
		ctx.reply( 'http://www.imdb.com/title/' + response[ 0 ].imdb ) )
	.catch( reason => console.log( 'Reject promise in search: ', reason ) )
} )

bot.command( 'source', ctx => {
	ctx.reply( 'https://github.com/Fazendaaa/imdb_bot_telegram' )
})

function replyInline( data ) {
	const poster = ( null != data.poster ) ? data.poster : 'http://www.costumecollection.com.au/media/images/cc/icons/exclamation-mark-300x262.gif'

	return {
		id: data.imdb.id,
		title: data.title,
		type: 'article',
		input_message_content: {
			message_text: 'http://www.imdb.com/title/' + data.imdb.id,
			parse_mode: 'HTML'
		},
		description: data.plot,
		thumb_url: poster,
	}
}

function __inlineSearch( array ) {
	return Promise
		   .all( array.map( data =>
			   imdb.get( data.id )
			   .then( movie => replyInline( movie ) )
			   .catch( issue => console.log( '__inlineSearch then: ', issue ) )
			) )
		   .catch( issue => console.log( '__inlineSearch Promise: ', issue ) )
}

function inlineSearch( movie ) {
	return imdb.search( movie )
		  .then( result => __inlineSearch( result ) )
		  .catch( issue => console.log( 'inlineSearch: ', issue ) )
}

bot.on( 'inline_query', ctx => {
	const movie = messageToString( ctx.inlineQuery.query ) || ''

	inlineSearch( movie )
	.then( response => ctx.answerInlineQuery( response ) )
	.catch( issue => console.log( 'inline_query: ', issue ) )
} )

bot.startPolling( )
