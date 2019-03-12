import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  StyleSheet,
  Modal,
  View,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native'

import ImageZoom from 'react-native-image-pan-zoom';




export default class ImageView extends Component {
  constructor (props, ctx) {
    super(props, ctx)

    this.state = {
      w:0,
      h:0,
    }
  }

  // componentWillReceiveProps (newProps) {
  //   console.log(newProps);
  //   if ((!this.props.visible && newProps.visible) || (this.props.options !== newProps.options)) {
  //   }
  // }

  getWindowDimension(event) {
    // TODO: reset inputMotionArea and poignées.
    this.setState({
      w: event.nativeEvent.layout.width,
      h: event.nativeEvent.layout.height,
    });
  }

  render () {

    const {
      title,
      titleTextStyle,
      overlayStyle,
      cancelContainerStyle,
      renderList,
      renderCancelButton,
      visible,
      modal,
      onCancel
    } = this.props

    const renderedTitle = (!title) ? null : (
      <Text 
      style={titleTextStyle || styles.titleTextStyle}
      >{title}</Text>
    )

    return (
      <Modal
        onRequestClose={onCancel}
        {...modal}
        visible={visible}
        supportedOrientations={['portrait', 'landscape']}
      >
          <View style={styles.cancelButton}
          >{renderedTitle}</View>

          <View 
            style={styles.main}
            onLayout={(event) => this.getWindowDimension(event)}
          >

            <ImageZoom
              cropWidth={this.state.w}
              cropHeight={this.state.h}
              imageWidth={this.state.w}
              imageHeight={this.state.h}
              >
              <Image
                style={{ 
                  width:this.state.w,
                  height:this.state.h,
                }}
                fadeDuration={0}
                resizeMode="contain"
                source={this.props.source }
              />
            </ImageZoom>

          </View>

          <View 
          // style={cancelContainerStyle || styles.cancelContainer}
          >
            {(renderCancelButton || this.renderCancelButton)()}
          </View>

      </Modal>
    )
  }

 

  renderCancelButton = () => {
    const {
      cancelButtonStyle,
      cancelButtonTextStyle,
      cancelButtonText
    } = this.props

    return (
      <TouchableOpacity onPress={this.props.onCancel}
        activeOpacity={0.7}
        style={cancelButtonStyle || styles.cancelButton}
      >
        <Text
          // style={styles.cancelButton}
         style={cancelButtonTextStyle || styles.cancelButtonText}
         >{cancelButtonText}</Text>
      </TouchableOpacity>
    )
  }


}

ImageView.propTypes = {
 
  onCancel: PropTypes.func.isRequired,
  placeholderText: PropTypes.string,
  placeholderTextColor: PropTypes.string,
  androidUnderlineColor: PropTypes.string,
  cancelButtonText: PropTypes.string,
  title: PropTypes.string,
  visible: PropTypes.bool,
  modal: PropTypes.object,
  renderCancelButton: PropTypes.func,
}

ImageView.defaultProps = {

  placeholderTextColor: '#ccc',
  androidUnderlineColor: 'rgba(0,0,0,0)',
  cancelButtonText: 'Retour',
  visible: true,
}


const styles = StyleSheet.create({ 
  cancelButton:{
    // borderWidth:2,borderColor:'red',
    alignItems: 'center',//'flex-end'
    padding:10,
  },
  main:{
    flex:1,
    // backgroundColor:'red',
  },
});