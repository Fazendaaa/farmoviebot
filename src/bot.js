require( 'dotenv' ).config( { path: '../.env' } )

const Telegraf = require( 'telegraf' )
const imdb = require( 'imdb-search' )
const bot = new Telegraf( process.env.BOT_TOKEN )

bot.use( Telegraf.log() )

const welcome = "Welcome to Farmoviesbot.\n\nType:\n/help"
const help = "Usage:\n\n\
@farmoviebot 'movie/tv show name'\n\
/search \'movie/tv show name\'\n\
/store -- leave your feedback\n\
/source -- see the code behind Farmoviesbot\n\n\
Any bugs or suggestions, talk to: @farmy"

bot.command( 'start', ctx => {
	ctx.reply( welcome )
})

bot.command( 'help', ctx => {
	ctx.reply( help )
})

bot.command( 'store', ctx => {
	ctx.reply( 'https://storebot.me/bot/farmoviebot' )
})

bot.command( 'source', ctx => {
	ctx.reply( 'https://github.com/Fazendaaa/farmoviebot' )
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

function verifyData( data, unit, error ) {
	return ( null != data && undefined != data ) ?
		   `${data}${unit}` : error
}

function replyMessage( data ) {
	const rating = verifyData( data.imdb.rating, '/10', 'Not avaliable' )
	const metacritic = verifyData( data.metacritic, '%', 'Not avaliable' )
	const plot = verifyData( data.plot, '', 'Not avaliable' )
	const rotten = ( undefined != data.tomato ) ?
				   ( undefined != data.tomato.ratting ?
				   `${data.tomato.ratting}%` : 'Not avaliable' ) :
				   'Not avaliable'

	return `[${data.title}](${'http://www.imdb.com/title/' + data.imdb.id})
- _IMDb_: *${rating}*
- _Metacritic_: *${metacritic}*
- _RottenTomatoes_: *${rotten}*`
}

function verifyObject( obj ) {
	return ( null != obj && undefined != obj && isNaN( obj ) ) ?
			 obj.join("\n") : 'Not avaliable'
}

bot.action( /.+/, ( ctx ) => {
	const result = ctx.match[ 0 ].split( "/" )
	imdb.get( result[ 0 ] )
	    .then( movie => {
			let data

			switch( result[ 1 ] ){
				case "plot":
					data = verifyData( movie.plot, '', 'Not avaliable' )
					break
				case "genres":
					data = verifyObject( movie.genres )
					break
				case "cast":
					const director = verifyData( movie.director, '',
												 'Not avaliable') 
					const actors = verifyObject( movie.actors )
					data = `Directed by: ${director}\nCasting:\n${actors}`
					break
				case "awards":
					data = verifyData( movie.awards.text, '', 'Not avaliable' )
					break
				default:
					data = 'Not avaliable'
			}

			return ctx.answerCallbackQuery( data.substring( 0, 199 ),
											undefined, true ) 
		}
	) 
})

function replyButton( id ) {
	return Telegraf.Extra
				   .markdown( )
				   .markup( ( m ) =>
				      m.inlineKeyboard( [
					      m.callbackButton( 'Plot', `${id}/plot` ),
						  m.callbackButton( 'Genres', `${id}/genres` ),
						  m.callbackButton( 'Cast', `${id}/cast` ),
						  m.callbackButton( 'Awards', `${id}/awards` )
				   ] )
	).reply_markup
}

function replyInline( data ) {
	const poster = verifyData( data.poster, '', 'http://bit.ly/2moqQnT' )
	const plot = verifyData(  data.plot, '', 'Not avaliable' )
	const newId = data.imdb.id

	return {
		id: newId,
		title: data.title,
		type: 'article',
		input_message_content: {
			message_text: replyMessage( data ),
			parse_mode: 'Markdown',
			disable_web_page_preview: false
		},
		reply_markup: replyButton( newId ),
		description: plot,
		thumb_url: poster
	}
}

function uniq( array ) {
	const lookup = {}

	return array.filter( data => {
		   		if( !( data.id in lookup ) ) {
		   			lookup[ data.id ] = 1
		   			return true
		   		}
		   	} )
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
	const notFound = {
						id: '0',
						title: 'Not Found',
						type: 'article',
						input_message_content: {
							message_text: 'http://www.imdb.com',
							parse_mode: 'HTML'
						},
						description: 'Content not found'
					}
	const messageSearch = "From tv shows to movies."
	const search = {
						id: '1',
						title: 'Search for anything',
						type: 'article',
						input_message_content: {
							message_text: messageSearch,
							parse_mode: 'Markdown'
						},
						description: messageSearch
					}

	if( '' == movie ) {
		return Promise.resolve( [ search ] )
	}
	else {
		return imdb.search( movie )
		  .then( result => __inlineSearch( result ) )
		  .catch( issue => {
		      console.log( 'inlineSearch: ', issue )
		  	  if ( 'Movie not found!' === issue )
		  	      return [ notFound ]
		  } )
	}
}

bot.on( 'inline_query', ctx => {
	const movie = messageToString( ctx.inlineQuery.query ) || ''

	inlineSearch( movie )
	.then( response => ctx.answerInlineQuery( uniq( response ) ) )
	.catch( issue => console.log( 'inline_query: ', issue ) )
} )

bot.startPolling( )
