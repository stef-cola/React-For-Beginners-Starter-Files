import React from 'react'
import AddFishForm from './AddFishForm'
import memoize from 'lodash.memoize'
import base from '../base'

class Inventory extends React.Component {
  constructor() {
    super()
    this.renderInventory = this.renderInventory.bind(this)
    this.renderLogin = this.renderLogin.bind(this)
    this.authenticate = this.authenticate.bind(this)
    this.authHandler = this.authHandler.bind(this)
    this.logout = this.logout.bind(this)

    //set the default state of the uid and owner to null
    this.state = {
      uid: null,
      owner: null,
    }

  }

  //When the component mounts check to see if there is an authenticated user.
  componentDidMount() {
    base.onAuth((user) => {
      if(user) {
        this.authHandler(null, { user });
      }
    })
  }

  //use lodash.memoize
  handleChange = memoize(key => e => {
    //Find the current fish object
    const fish = this.props.fishes[key]
    //copy the fish state and update it with new data
    const updatedFish = {
      ...fish,
      [e.target.name]: e.target.value,
    }
    //Send the updated fish up to the App component via props
    this.props.updateFish(key, updatedFish)
  })

  authenticate(provider) {
    base.authWithOAuthPopup(provider, this.authHandler);
  }

  logout() {
    base.unauth();
    this.setState( {uid: null });
  }

  authHandler(err, authData) {
    console.log(authData);
    if(err) {
      console.error(err);
      return;
    }
    //Grab the store information from Firebase
    const storeRef = base.database().ref(this.props.storeId);
    storeRef.once('value', (snapshot) => {
      const data = snapshot.val() || {};

      //Claim the store for this user if there is no owner already
      if(!data.owner) {
        storeRef.set({
          owner: authData.user.uid,
        })
      }

      //Set the state to trigger a re-render
      this.setState({
        uid: authData.user.uid,
        owner: data.owner || authData.user.uid,
      });
    })

    //Does the user own the store



  }

  renderLogin() {
    return(
      <nav className="login">
        <h2>Inventory</h2>
        <p>Sign in to manage your store's inventory.</p>
        <button className="github" onClick={() => this.authenticate('github')}>Log In with GitHub</button>
        <button className="facebook" onClick={() => this.authenticate('facebook')}>Log In with Facebook</button>
        <button className="twitter" onClick={() => this.authenticate('twitter')}>Log In with Twitter</button>
      </nav>
    )
  }

  renderInventory(key) {
    //Map through all of the fish objects passed down in the props
    const fish = this.props.fishes[key]
    //return form for each fish, fill it with a default value & set an onChange handler to listen for updates
    return (
      <div className="fish-edit" key={key}>
        <input
          type="text"
          name="name"
          defaultValue={fish.name}
          onChange={this.handleChange(key)}
        />
        <input
          type="text"
          name="price"
          defaultValue={fish.price}
          onChange={this.handleChange(key)}
        />
        <select
          type="text"
          name="status"
          defaultValue={fish.status}
          onChange={this.handleChange(key)}>
          <option value="available">Fresh!</option>
          <option value="unavailable">Sold Out!</option>
        </select>
        <textarea
          type="text"
          name="desc"
          defaultValue={fish.desc}
          onChange={this.handleChange(key)}
        />
        <input
          type="text"
          name="image"
          defaultValue={fish.image}
          onChange={this.handleChange(key)}
        />
        <button onClick={() => this.props.removeFish(key)}>Remove Fish</button>
      </div>
    )
  }

  render() {
    const logout = <button onClick={this.logout}>Log Out!</button>

    //Check if the user is logged in. If not, return 'renderLogin'
    if(!this.state.uid) {
      return <div>{this.renderLogin()}</div>
    }

    //Check if the user is the owner of the current store.
    if(this.state.uid !== this.state.owner){
      return(
        <div>
          <p>Sorry, you aren't the owner of this store.</p>
          {logout}
        </div>
      )
    }

    return (
      <div>
        <h2>Inventory</h2>
        {logout}
        {Object.keys(this.props.fishes).map(this.renderInventory)}
        <AddFishForm addFish={this.props.addFish} />
        <button onClick={this.props.loadSamples}>Add Sample Fish</button>
      </div>
    )
  }
}

Inventory.propTypes = {
  updateFish: React.PropTypes.func.isRequired,
  fishes: React.PropTypes.object.isRequired,
  removeFish: React.PropTypes.func.isRequired,
  addFish: React.PropTypes.func.isRequired,
  loadSamples: React.PropTypes.func.isRequired,
  storeId: React.PropTypes.string.isRequired,
}

export default Inventory
