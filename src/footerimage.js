import React, { Component } from 'react'
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';
import {
  View,
  Image,
} from 'react-native'

export default class FooterImage extends Component {
  constructor (props) {
    super(props)
    this.state = {
      width:0,
    };

    if (__DEV__) {
      this.footer_source = { uri: `${resolveAssetSource(require('../img/footer.png')).uri}` };
    } else {
      this.footer_source = {uri: 'asset:/img/footer.png'};
    }
  }

  onLayout = (e) => {
    this.setState({
      width: e.nativeEvent.layout.width,
      // height: e.nativeEvent.layout.height,
    })
  }

  render(){
    return(
      <View
        onLayout={this.onLayout}
      >
      <Image 
        style={{width:this.state.width, height:this.state.width*0.65}}
        source={this.footer_source} 
      />
      </View>
    );
  }

}
