import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  StyleSheet,
  Modal,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native'

import ImageViewer from 'react-native-image-zoom-viewer';


export default class ImageView extends Component {
  constructor (props, ctx) {
    super(props, ctx)

    const srcs = [];  //        {uri:'file://'+props.path+'/'+item}
    props.sources.forEach(function(item){ //source: {uri: this.props.failImageSource.url}
      srcs.push({ url:'file://'+props.path+'/'+item });
    });
    this.state = { sources:srcs }
  }

  // getWindowDimension(event) {
  //   // if()
  //   console.log( event.nativeEvent.layout)
  //   this.setState({
  //     w: event.nativeEvent.layout.width,
  //     h: event.nativeEvent.layout.height,
  //   });
  // }

  render () {

    return (
      <Modal
        onRequestClose={this.props.onCancel}
        visible={this.props.visible}
        supportedOrientations={['portrait', 'landscape']}
        >
        <ImageViewer 
          imageUrls={this.state.sources}
          enablePreload={true}
          renderIndicator ={()=> null}
          renderHeader={(currentIndex) => 
            <View style={{flexDirection:'row'}}>
              <ScrollView horizontal={true} >
                <View style={this.props.styles.container}>
                  <Text style={this.props.styles.text}>
                   { this.props.title}
                  </Text>
                </View>
              </ScrollView>

              <View style={this.props.styles.container}>
                <Text style={this.props.styles.text}>
                {currentIndex+1}/{this.state.sources.length}
                </Text>
              </View>
            </View>
          }
          renderFooter={() => null} // renders below screnn bottom
        />

        <TouchableOpacity 
          onPress={this.props.onCancel}
          style={this.props.styles.container}
        >
          <Text style={this.props.styles.text}>
          Retour</Text>
        </TouchableOpacity>

      </Modal>
    )
  }
}


