// OLD card - replaced by the one inside App.jsx. keep for now, marketing might want it back
import React from 'react'
export default class ProductCard extends React.Component {
  render() {
    var p = this.props.p
    return <div className="pcard"><h3>{p.name}</h3><span>{p.price}</span><button onClick={() => this.props.add(p.id)}>Add</button></div>
  }
}
