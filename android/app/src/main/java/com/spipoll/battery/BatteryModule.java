package com.spipoll;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import com.facebook.react.bridge.Callback;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;

import java.io.IOException;

public class BatteryModule extends ReactContextBaseJavaModule {

  public BatteryModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }


  // private boolean firstRun = true;
  // private Bitmap bitmapG = null;
  // private WritableNativeArray pixelG = new WritableNativeArray();
  // private int[][] previousRed;

  
  @Override
  public String getName() {
    return "Battery";
  }

  @ReactMethod
  public void getLevel(final Promise promise) {
    try {
      Intent batteryIntent = getCurrentActivity().registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
      int level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
      int scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
   
      if(level == -1 || scale == -1) {
          level = 0;
      }
      
      promise.resolve(level);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void getBatteryStatus(Callback successCallback) {
    Intent batteryIntent = getCurrentActivity().registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
    int level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
    int scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);

    if(level == -1 || scale == -1) {
        level = 0;
    }
    //System.out.print("battery level");
    //System.out.print(level);
    successCallback.invoke(level);
  }
}

