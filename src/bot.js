require( 'dotenv' ).config( { path: '../.env' } )

const Telegraf = require( 'telegraf' )
const imdb = require( 'imdb-search' )
const moment = require( 'moment' )
const humanize = require( 'humanize-duration' )
const bot = new Telegraf( process.env.BOT_TOKEN )

bot.use( Telegraf.log() )

const welcome = "Welcome to Farmoviesbot.\n\nType:\n/help"
const help = "Usage:\n\n\
@farmoviebot 'movie/tv show name'\n\
/search \'movie/tv show name\'\n\
/store -- leave your feedback\n\
/source -- see the code behind Farmoviesbot\n\n\
Any bugs or suggestions, talk to: @farmy"
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

bot.command( 'start', ctx => {
	ctx.reply( welcome )
})

bot.command( 'help', ctx => {
	ctx.reply( help )
})

bot.command( 'store', ctx => {
	ctx.reply( 'https://telegram.me/storebot?start=farmoviebot' )
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


function verifyData( data, error ) {
	return ( null != data && undefined != data && '' != data ) ? `${data}` : error
}

function verifyRelease( data ) {
	return ( null != data && undefined != data ) ?
			 `- _Release_: *${moment( data ).format( 'LL' )}*\n` : ''
}

function verifyDataMd( pre, data, unit ) {
	return ( null != data && undefined != data ) ?
		   `- _${pre}_: *${data}${unit}*\n` : ''
}

function verifyRuntime( data ) {
	return ( null != data && undefined != data ) ?
			 `- _Runtime_: *${humanize( data*60000 ) }*\n` : ''
}

function verifyObject( obj ) {
	return ( null != obj && undefined != obj && isNaN( obj ) ) ?
			 obj.join("\n") : 'NotAvailable'
}

function replyMessage( data ) {
	const poster = verifyData( data.poster, "http://bit.ly/2oXVrqT" )
	const released = verifyRelease( data.released )
	const rated = verifyDataMd( "Rated", data.rated, '' )
	const runtime = verifyRuntime( data.runtime )
	const rating = verifyDataMd( "IMDb", data.imdb.rating, '/10' )
	const metacritic = verifyDataMd( "Metacritic", data.metacritic, '%' )
	const rotten = ( undefined != data.tomato ) ?
				   ( undefined != data.tomato.ratting ?
				   `- _RottenTomatoes_: *${data.tomato.ratting}%*` : '' ) : ''

	//	'\u200B' is the invisible unicode character
	return `[\u200B](${poster})[${data.title}](${'http://www.imdb.com/title/' + data.imdb.id})
${released}${rated}${runtime}${rating}${metacritic}${rotten}`
}

bot.command( 'search', ctx => {
	const movie = messageToString( removeCmd( ctx ) )

	if( '' != movie  )
		imdb.search( movie )
			.then( response =>
				imdb.get( response[ 0 ].imdb )
			   		.then( movie => ctx.reply( replyMessage( movie ),
					    					   { parse_mode: 'Markdown' } ) )
					.catch( issue => console.log( 'Reject promise in get search: ',
										   issue ) ) )
			.catch( issue => console.log( 'Reject promise in search search: ',
										   issue ) )
	else
		ctx.reply( `Movie not found: try it again, please.` )
} )

bot.action( /.+/, ( ctx ) => {
	const result = ctx.match[ 0 ].split( "/" )
	imdb.get( result[ 0 ] )
	    .then( movie => {
			let data

			switch( result[ 1 ] ){
				case "plot":
					data = verifyData( movie.plot, "Not Available" )
					break
				case "genres":
					data = verifyObject( movie.genres )
					break
				case "cast":
					const director = verifyData( movie.director, "Not Available" ) 
					const actors = verifyObject( movie.actors, "Not Available" )
					data = `Directed by: ${director}\nCasting:\n${actors}`
					break
				case "awards":
					data = verifyData( movie.awards.text, "Not Available" )
					break
				default:
					data = 'Not Available'
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
	const poster = verifyData( data.poster, 'http://bit.ly/2moqQnT' )
	const plot = verifyData(  data.plot, 'Not Available' )
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
	if( '' == movie )
		return Promise.resolve( [ search ] )

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
