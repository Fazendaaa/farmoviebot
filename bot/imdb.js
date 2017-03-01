require( 'dotenv' ).config( { path: '../.env' } )
const Telegraf = require( 'telegraf' )
const imdb = require( 'imdb-api' )
const bot = new Telegraf( process.env.BOT_TOKEN )

const welcome = "Welcome to IMDB bot.\n\nType:\n/help"
const help = "Usage:\n\n/search \'movie name\'\n/source -- see the code behind IMDBbot\n\nAny bugs or suggestions, talk to: @farm_kun"

bot.command( 'start', (ctx) => {
	console.log( 'start', ctx.from )
	ctx.reply( welcome )
})

bot.command( 'help', (ctx) => {
	console.log( 'help', ctx.from )
	ctx.reply( help )
})

function search( movie, callback ) {
	const value = movie

	imdb.get( value, ( err, response ) => {
					if( err )
						console.log( 'Error in function search: ', err )
					else {
						const data = response
						return callback( data )
					}
				}
			)
}

bot.command( 'search', (ctx) => {
	const movie = ctx.message.text.split(' ').slice( 1 ).join(' ')

	search( movie, response => {
						const data = response
  						ctx.reply( data.imdburl )
  					}
  		  )
})

bot.command( 'source', (ctx) => {
	ctx.reply( 'https://github.com/Fazendaaa/imdb_bot_telegram' )
})

const inline = [ {
					id: 'search',
					title: 'SEARCH IN IMDB',
					type: 'article',
					input_message_content: {
	  					message_text: `Please, type again`
				  	}
				} ]

function inline_search( movie, callback ) {
	search( movie, response => {
						const data = response
						inline.push( data )
						console.log( inline )
						return callback( inline )
			      }
		  )
}

bot.on( 'inline_query', (ctx) => {
	const movie = ctx.inlineQuery.query || ''

	inline_search( movie, response => {
		const result = response.
					   filter( ( value )=> value.title.toLowerCase().indexOf( movie.toLowerCase()) !== -1 ).
					   map( ( value ) => {
					       return {
			    				id: value.title,
			    				title: value.title,
			    				type: 'article',
			    				input_message_content: {
			      					message_text: value.imdburl,
			      					parse_mode: 'HTML'
			    			  	},
			    			  	url: value.url,
			    			  	description: value.plot,
			    			 	thumb_url: value.poster
							}
					   } )

		ctx.answerInlineQuery( result )
	} )
} )

bot.startPolling( )