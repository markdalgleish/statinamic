import React, { Component } from "react"
import { PropTypes } from "react"
import Helmet from "react-helmet"

import pkg from "../../package.json"

// function pageDescription(text) {
//   return text
// }

export default class Page extends Component {

  static propTypes = {
    children: PropTypes.oneOfType([ PropTypes.array, PropTypes.object ]),
    head: PropTypes.object.isRequired,
    body: PropTypes.string.isRequired,
  }

  render() {
    const {
      head,
      body,
    } = this.props

    const meta = [
      { name: "twitter:title", content: head.title },
      { name: "twitter:creator", content: `@${ pkg.twitter }` },
      // { name: "twitter:site", content: `@${ pkg.twitter }` },
      // { name: "twitter:description", content: pageDescription(body) },
      // { name: "twitter:image", content: header.image },
      { property: "og:site_name", content: pkg.name },
      { property: "og:title", content: head.title },
      { property: "og:type", content: "article" },
      // { property: "og:url", content: "http://www.example.com/" },
      // { property: "og:description", content: pageDescription(body) },
      // { property: "og:image", content: header.image },
    ]

    return (
      <div>
        <Helmet
          title={ head.title }
          meta={ meta }
        />

        <h1>{ head.title }</h1>
        {
          body &&
          <div
            dangerouslySetInnerHTML={{ __html: body }}
          />
        }
        { this.props.children }
      </div>
    )
  }
}
