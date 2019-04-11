import React, { Component } from 'react'
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';
import {
  View,
  Image,
  Dimensions,
} from 'react-native'

 
export default class FooterImage extends Component {
  constructor (props) {
    super(props)

    if (__DEV__) {
      this.footer_source = { uri: `${resolveAssetSource(require('../img/footer.png')).uri}` };
    } else {
      this.footer_source = {uri: 'asset:/img/footer.png'};
    }
    this.w = Dimensions.get('window').width;
  }

  render(){
    return(
      <View style={{flex:1, marginTop:50}} >
        
        <View style={{flex:1}} />

        <Image 
          fadeDuration={0}
          style={{width:this.w, height:this.w*0.65}}
          source={this.footer_source} 
        />

      </View>
    );
  }

}
