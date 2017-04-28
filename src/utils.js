const imdb = require( 'imdb-search' )
const moment = require( 'moment' )
const humanize = require( 'humanize-duration' )
const Telegraf = require( 'telegraf' )

function removeCmd( ctx ) {
    return ctx.message.text.split(' ').slice( 1 ).join(' ')
}

/*	It's not a pretty function, but when is typed 'gantz:o', :o turns out to
    be  a  emoji. Or when typed 'gantz:0', the IMDB API return 'gantz' only,
    they have to be 'gantz:o'
*/
function messageToString( message ) {
    return Buffer
            .from( message, 'ascii' )
            .toString( 'ascii' )
            .replace( /(?:=\(|:0|:o|: o|: 0)/, ': o' )
}

function verifyData( data, error ) {
    return ( null != data && undefined != data && '' != data ) ?
            `${data}` : error
}

function verifyRelease( data ) {
    return ( null != data && undefined != data ) ?
            `- _Release_: *${moment( data ).format( 'MMMM Do YYYY' )}*\n` :
            ''
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
    const metacritic = verifyDataMd( "Metacritic", data.metacritic,
                                            '%' )
    const rotten = ( undefined != data.tomato ) ?
                ( undefined != data.tomato.ratting ?
                `- _RottenTomatoes_: *${data.tomato.ratting}%*` : '' ) : ''

    //	'\u200B' is the invisible unicode character
    return `[\u200B](${poster})[${data.title}](
${'http://www.imdb.com/title/' + data.imdb.id})
${released}${rated}${runtime}${rating}${metacritic}${rotten}`
}

function replyCallback( string ) {
    const lastIndex = string.lastIndexOf(" ")
    const newString = string.substring( 0, lastIndex )
    
    return `${newString}...`
}

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
                .catch( issue => 
                        console.log( '__inlineSearch then: ', issue ) )
            ) )
            .catch( issue =>
                console.log( '__inlineSearch Promise: ', issue )
            )
}

function inlineSearch( movie ) {
    const messageSearch = "From tv shows to movies."
    const search = {
                        id: '1',
                        title: 'Search for anything',
                        type: 'article',
                        input_message_content: {
                            message_text: messageSearch,
                            parse_mode: 'Markdown'
                        },
                        description: messageSearch,
                        thumb_url: 'www.bit.ly/2pe0Xso'
                    }
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

    if( '' == movie )
        /*  inlineSearch  must  be  a  Promise, so if no movie is send, 'search' 
            still need to be a Promise
        */
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

function buttons( movie, type ) {
    return Promise.resolve( 
        imdb.get( movie )
            .then( movie => {
                let data

                switch( type ) {
                    case "plot":
                        const plot = verifyData( movie.plot, 'Not Available' )
                        data = ( 'Not Available' != plot ) ?
                                replyCallback( plot.substring( 0, 196 ) ) :
                                'Not Available'
                        break
                    case "genres":
                        data = verifyObject( movie.genres )
                        break
                    case "cast":
                        const director = verifyData( movie.director,
                                                        'Not Available' ) 
                        const actors = verifyObject( movie.actors, 'Not Available' )
                        data = `Directed by: ${director}\nCasting:\n${actors}`
                        break
                    case "awards":
                        data = verifyData( movie.awards.text, 'Not Available' )
                        break
                    default:
                        data = 'Not Available'
                }

                return data
            }
        )
    )
}

module.exports = {
    imdb: imdb,
    removeCmd: removeCmd,
    messageToString: messageToString,
    replyMessage: replyMessage,
    uniq: uniq,
    inlineSearch: inlineSearch,
    buttons: buttons
}
