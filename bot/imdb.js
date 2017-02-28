const Telegraf = require( 'telegraf' )
const token = require( './token.js' )

const bot = new Telegraf( token, { username: 'IMDB' } )

bot.command( 'start', ( ctx ) => ctx.reply( 'Helolo' ) )

bot.on( 'text', ( ctx ) => {
	ctx.reply( 'Hello ${ ctx.state.role }' )
})

bot.on( '/quit', ( ctx ) => {
	ctx.leaveChat( 'Bye, ${ ctx.state.role }' )
})

bot.on( 'iline_query', ( ctx ) => {
	const result = []

	ctx.answerInlineQuery( result )
})