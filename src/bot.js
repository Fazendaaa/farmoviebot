require( 'dotenv' ).config( { path: '../.env' } )

const utils = require( './utils' )
const Telegraf = require( 'telegraf' )
const moment = require( 'moment' )
const humanize = require( 'humanize-duration' )
const bot = new Telegraf( process.env.BOT_TOKEN )

bot.use( Telegraf.log( ) )

bot.command( 'start', ctx => {
	utils.createProfile( ctx.message.from.id )
	ctx.reply( "Welcome to Farmoviesbot.\n\nType:\n/help" )
})

bot.command( 'help', ctx => {
	ctx.reply( "Usage:\n\n\
@farmoviebot 'movie/tv show name'\n\
/search \'movie/tv show name\'\n\
/store -- leave your feedback\n\
/source -- see the code behind Farmoviesbot\n\n\
Any bugs or suggestions, talk to: @farmy" )
})

bot.command( 'store', ctx => {
	ctx.reply( 'https://telegram.me/storebot?start=farmoviebot' )
})

bot.command( 'source', ctx => {
	ctx.reply( 'https://github.com/Fazendaaa/farmoviebot' )
})

bot.command( 'search', ctx => {
	const movie = messageToString( removeCmd( ctx ) )

	if( '' != movie  )
		imdb.search( movie )
			.then( response =>
				imdb.get( response[ 0 ].imdb )
			   		.then( movie => ctx.reply( utils.replyMessage( movie ),
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

	utils.buttons( result[ 0 ], result[ 1 ] ).then( data => {
		ctx.answerCallbackQuery( data, undefined, true ) 
	} )
})

bot.on( 'inline_query', ctx => {
	const movie = utils.messageToString( ctx.inlineQuery.query ) || ''

	utils.inlineSearch( movie )
	.then( response => ctx.answerInlineQuery( utils.uniq( response ) ) )
	.catch( issue => console.log( 'inline_query: ', issue ) )
} )

bot.startPolling( )
