/**
 * LoadingView
 */
'use strict';

import React, { Component } from 'react';

import {
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Text,
  View,
  Easing
} from 'react-native';

var TIMES = 400;

export default class MotionManager extends Component {

  constructor(props) {
    super(props);
    this.state = {
      opacity: new Animated.Value(0),
    };
  }

  componentDidMount() {
    this.loadingAnimation();
  }

  loadingAnimation() {

    this.toValue = (this.toValue==0) ?1:0;
    Animated.timing(
      this.state.opacity,
      {
        toValue: this.toValue,
        duration:500,
        useNativeDriver: true,
      }
    ).start(() => this.loadingAnimation())  
  }

  render() {
    return (
      <View style={styles.container}>
          <Animated.Text
            style={{opacity: this.state.opacity}}>
            Chargement ...
          </Animated.Text>
      </View>
    );
  }
};

var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

});

