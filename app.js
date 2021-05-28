require('dotenv').config()

const logger = require('morgan')
const express = require('express')
const errorHandler = require('errorhandler')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')

const path = require('path')
const app = express()
const port = 3000

const Prismic = require('@prismicio/client')
const PrismicDOM = require('prismic-dom')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(methodOverride())
app.use(errorHandler())

// Link Resolver
const handleLinkResolver = doc => {
  if (doc.type === 'product') {
    return `/detail/${doc.slug}`
  }
}

// Middleware to inject prismic context
app.use((req, res, next) => {
  // res.locals.ctx = {
  //   endpoint: process.env.PRISMIC_ENDPOINT,
  //   linkResolver: handleLinkResolver
  // }

  res.locals.Link = handleLinkResolver
  // add PrismicDOM in locals to access them in templates.
  res.locals.PrismicDOM = PrismicDOM
  next()
})

// Initialize the prismic.io api
const initApi = req => {
  return Prismic.getApi(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    req
  })
}

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.get('/', (req, res) => {
  initApi(req).then(async api => {
    const meta = await api.getSingle('metadata')
    const home = await api.getSingle('home')
    const preloader = await api.getSingle('preloader')
    const collections = await api.query(Prismic.Predicates.at('document.type', 'collection'), {
      fetchLinks: 'product.image'
    })

    const results = collections.results

    res.render('pages/home', {
      meta,
      home,
      results,
      preloader
    })
  })
})

// stick the about page to the about route
app.get('/about', (req, res) => {
  initApi(req).then(async api => {
    const meta = await api.getSingle('metadata')
    const about = await api.getSingle('about')
    const preloader = await api.getSingle('preloader')

    res.render('pages/about', {
      meta,
      about,
      preloader
    })
  })
})

app.get('/detail/:uid', (req, res) => {
  initApi(req).then(async api => {
    const meta = await api.getSingle('metadata')
    const preloader = await api.getSingle('preloader')
    const product = await api.getByUID('product', req.params.uid, {
      fetchLinks: 'collection.title'
    })

    res.render('pages/detail', {
      meta,
      product,
      preloader
    })
  })
})

app.get('/collections', (req, res) => {
  initApi(req).then(async api => {
    const meta = await api.getSingle('metadata')
    const home = await api.getSingle('home')
    const preloader = await api.getSingle('preloader')
    const collections = await api.query(Prismic.Predicates.at('document.type', 'collection'), {
      fetchLinks: 'product.image'
    })

    const results = collections.results

    // console.log(collections)
    console.log(collections.results[0].data)

    res.render('pages/collections', {
      meta,
      home,
      results,
      preloader
    })
  })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
