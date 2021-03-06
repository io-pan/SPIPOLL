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
import android.os.Environment;

import  android.content.Context;
import  android.support.v4.content.ContextCompat;

import java.io.IOException;
import java.io.File;
import java.io.FileOutputStream;
// import java.io.FileInputStream;
  import android.content.res.Resources;
import java.util.Locale;
import java.util.List;
import android.location.Address;
import android.location.Geocoder;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.graphics.Canvas;
import android.graphics.Rect;

import android.util.Base64;
import java.io.ByteArrayOutputStream;
import android.media.ExifInterface;

public class IopanModule extends ReactContextBaseJavaModule {

  private Context mContext;

  public IopanModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mContext = reactContext;
  }


  // private boolean firstRun = true;
  // private Bitmap bitmapG = null;
  // private WritableNativeArray pixelG = new WritableNativeArray();
  // private int[][] previousRed;

  
  @Override
  public String getName() {
    return "ioPan";
  }


  @ReactMethod
  public void getLocationName(double lat, double lng, final Promise promise) {
    try {

      Geocoder geocoder = new Geocoder(mContext, Locale.FRENCH);
      List<Address> addresses = geocoder.getFromLocation(lat, lng, 1);
      Address obj = addresses.get(0);

      String add = obj.getLocality();//getAddressLine(0);
      // add = add + "," + obj.getAdminArea();
      // add = add + "," + obj.getCountryName();

      promise.resolve(add);

    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void getLocationCoord(String locationName, final Promise promise) {
    try {

      Geocoder geocoder = new Geocoder(mContext, Locale.FRENCH);
      List<Address> addresses = geocoder.getFromLocationName(locationName,1);
      Address obj = addresses.get(0);

      WritableNativeMap rv = new WritableNativeMap();
      rv.putDouble("lat", obj.getLatitude());
      rv.putDouble("lng", obj.getLongitude());
      promise.resolve(rv);

    } catch (Exception e) {
      promise.reject(e);
    }
  }


  @ReactMethod
  public void getBatteryInfo(final Promise promise) {
    try {
      Intent batteryIntent = getCurrentActivity().registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
      int level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
      int scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);

      if(level == -1 || scale == -1) {
          level = 0;
      }

      int status = batteryIntent.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
      boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING;
      
      WritableNativeMap rv = new WritableNativeMap();
      rv.putBoolean("charging", isCharging);
      rv.putInt("level", level);

      promise.resolve(rv);

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

    int status = batteryIntent.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
    boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING;
    
    WritableNativeMap rv = new WritableNativeMap();
    rv.putBoolean("charging", isCharging);
    rv.putInt("level", level);

    successCallback.invoke(rv);
  }

  @ReactMethod
  public void getExternalStorages(final Promise promise) {
    try {
    
        String rv = "[";
        File[] aDirArray = ContextCompat.getExternalFilesDirs(mContext, null);
        for(int i =0; i<aDirArray.length;i++){
          String type = "";
          if (Environment.isExternalStorageRemovable(aDirArray[i])){
            if (Environment.getExternalStorageState(aDirArray[i]).equals(Environment.MEDIA_MOUNTED)){
              rv += "{\"type\":\"card\", \"path\":\""+aDirArray[i].getAbsolutePath()+"\"}";
            }
          }
          else{
            rv += "{\"type\":\"phone\", \"path\":\""+aDirArray[i].getAbsolutePath()+"\"}";
          }

          if(i<aDirArray.length-1){
            rv += ",";
          }
        }
        rv += "]";
        // if (Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED)) {
        //   File[] f;
        //   rv += " --- getExternalMediaDirs: ";
        //   f = mContext.getExternalMediaDirs();//mContext.getExternalMediaDirs()
        //   for(int i =0; i<f.length;i++){
        //     rv += f[i].getAbsolutePath() + " - ";
        //   }

        //   rv += " --- getExternalFilesDirs:";
        //   f = mContext.getExternalFilesDirs(Environment.DIRECTORY_PICTURES);//mContext.getExternalMediaDirs()
        //   for(int i =0; i<f.length;i++){
        //     rv += f[i].getAbsolutePath() + " - ";
        //   }

        //   // rv += " --- getExternalCacheDirs: ";
        //   // f = mContext.getExternalCacheDirs();//mContext.getExternalMediaDirs()
        //   // for(int i =0; i<f.length;i++){
        //   //   rv += f[i].getAbsolutePath() + " - ";
        //   // }


           promise.resolve(rv);
        // } else {
        //     promise.reject("RNFetchBlob.getSDCardDir", "External storage not mounted");
        // }
    } catch (Exception e) {
      promise.reject(e);
    }
    
  }

  @ReactMethod
  public void getImageSize(
    String src_path, 
    final Promise promise) {
      WritableNativeMap returnValue = new WritableNativeMap();
      
      try {
      // Load bitmap.
      Bitmap bitmap = null;
      BitmapFactory.Options options = new BitmapFactory.Options();
      options.inPreferredConfig = Bitmap.Config.ARGB_8888;
      bitmap = BitmapFactory.decodeFile(src_path, options);

      int w = bitmap.getWidth();
      int h = bitmap.getHeight();

      // Get image original orientation.
      ExifInterface exif = new ExifInterface(src_path);
      int originalOrientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
      originalOrientation = exifToDegrees(originalOrientation);
     

      if(originalOrientation == 0 ||originalOrientation == 180 ){
        returnValue.putInt("w", w);
        returnValue.putInt("h", h);      
      }
      else {
        returnValue.putInt("w", h);
        returnValue.putInt("h", w);      
      }

      promise.resolve(returnValue);
    } catch (Exception e) {
      promise.reject(e);
    }

  }

  @ReactMethod
  public void cropBitmap(
    String src_path, 
    String dst_path, 
    int w,
    int h,
    double x,
    double y, 
    double rotation,
    double scale,
    float switch_orientation,
    final Promise promise) {

    WritableNativeMap returnValue = new WritableNativeMap();
      // returnValue.putString("0 path src ", src_path);
      // returnValue.putString("0 path dest", dst_path);
      // returnValue.putInt("0 _w",  w);
      // returnValue.putInt("0 _h",  h);
      // returnValue.putDouble("0 __x", x);
      // returnValue.putDouble("0 __y", y);
      // returnValue.putDouble("0 rotation", rotation);
      // returnValue.putDouble("0 scale", scale);  
      // returnValue.putDouble("0 switch_orientation", switch_orientation);  

    try {
      // Load bitmap.
      Bitmap bitmap = null;
      BitmapFactory.Options options = new BitmapFactory.Options();
      options.inPreferredConfig = Bitmap.Config.ARGB_8888;
      bitmap = BitmapFactory.decodeFile(src_path, options);
        // returnValue.putString("11 w", ""+ bitmap.getWidth());
        // returnValue.putString("12 h", ""+ bitmap.getHeight());


      // Get and set original orientation.
      ExifInterface exif = new ExifInterface(src_path);
      int originalOrientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
      originalOrientation = exifToDegrees(originalOrientation);
      // returnValue.putString("19 orientation", ""+originalOrientation);
      bitmap = Bitmap.createBitmap(
        rotateBitmap(bitmap,originalOrientation),
        0,0, w, h
      );


      // Make a square image with with margins.
      int squareDim = (int)Math.max(w,h);
      Bitmap squareBitmap = Bitmap.createBitmap(squareDim, squareDim, bitmap.getConfig());
      Canvas canvas = new Canvas(squareBitmap);
      canvas.drawColor(0xFFFFFFFF);

      canvas.drawBitmap(bitmap, 
        new Rect(0,0,(int)w,(int)h),
        new Rect(
          (int)((squareDim-w)/2),
          (int)((squareDim-h)/2), 
          (int)(squareDim-(squareDim-w)/2), 
          (int)(squareDim-(squareDim-h)/2)
        ),
        null
      );
      bitmap = squareBitmap;
      squareBitmap = null;


      // Rotate.
      bitmap = rotateBitmap(bitmap, (float)rotation);
      int newW = bitmap.getWidth();
      int newH = bitmap.getHeight();
        // returnValue.putString("40 rotation ok.  ", " ");
        // returnValue.putString("41 newW: ", " " + newW  );
        // returnValue.putString("42 newH: ", " " +   newH);


      // Keep portion of bitmap based on given scale and translation.
      int finalWidth = (int)Math.round(w/scale);//(int)Math.round(w/scale);
      int finalHeight = (int)Math.round(h/scale);//(int)Math.round(h/scale);
        // returnValue.putString("46 finalWidth", ""+ finalWidth);
        // returnValue.putString("47 finalHeight", ""+ finalHeight);

      int nx = (int)Math.round((newW - w)/2) // Additional width due to rotation
             + (int)Math.round(x);

      int ny = (int)Math.round((newH - h)/2) // Additional height due to rotation
             + (int)Math.round(y);
        // returnValue.putString("55 nx ", ""+nx);
        // returnValue.putString("56 ny ", ""+ny);


      // Reset vales if out of canvas.
      if(nx+finalWidth > newW){
        nx = newW - finalWidth;   // returnValue.putString("57 reset nx ", ""+nx);
      } 

      if(ny+finalHeight > newH){
        ny = newH - finalHeight;     // returnValue.putString("58 reset ny ", ""+ny);
      }

      if(nx < 0){
        nx = 0;
         returnValue.putString("57 reset nx ", ""+nx);
      }

      if(ny < 0){ 
        ny = 0;  
         returnValue.putString("58 reset ny ", ""+ny);
      }

      bitmap = Bitmap.createBitmap(
        bitmap,
        nx, 
        ny, 
        finalWidth, 
        finalHeight
      );


      // Rotate final bitmap if orientation changed.
      if(switch_orientation!=0){
        bitmap = rotateBitmap(bitmap, switch_orientation);
      }


      // Save file.
      // String filname = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM) + "/test.jpg";
      String filname = dst_path;
      try {
          FileOutputStream fOutputStream = new FileOutputStream(filname);

          bitmap.compress(Bitmap.CompressFormat.JPEG, 80, fOutputStream);
          fOutputStream.flush();
          fOutputStream.close();
          fOutputStream = null;
      } catch (Resources.NotFoundException e) {
          returnValue.putString("error","motion Documents directory of the app could not be found."+filname);
          promise.resolve(returnValue);
      } catch (IOException e) {
          returnValue.putString("error","motion An unknown I/O exception has occurred."+filname);
          promise.resolve(returnValue);
      }

      // returnValue.putString("99", "file saved");
      promise.resolve(returnValue);

    } catch (Exception e) {
      // returnValue.putString("999 error ", ""+e);
      // promise.resolve(returnValue);
      promise.reject(e);
    }
  }


  public static Bitmap rotateBitmap(Bitmap source, float angle){
    Matrix matrix = new Matrix();
    matrix.postRotate(angle);

    return Bitmap.createBitmap(source, 0, 0, source.getWidth(), source.getHeight(), matrix, true);
  }

  private static int exifToDegrees(int exifOrientation) {        
      if (exifOrientation == ExifInterface.ORIENTATION_ROTATE_90) { return 90; } 
      else if (exifOrientation == ExifInterface.ORIENTATION_ROTATE_180) {  return 180; } 
      else if (exifOrientation == ExifInterface.ORIENTATION_ROTATE_270) {  return 270; }            
      return 0;    
   }
}

