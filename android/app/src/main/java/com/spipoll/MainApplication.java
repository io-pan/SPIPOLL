package com.spipoll;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.rnfs.RNFSPackage;
import com.airbnb.android.react.maps.MapsPackage;
import me.hauvo.thumbnail.RNThumbnailPackage;
import com.mehcode.reactnative.splashscreen.SplashScreenPackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import fr.greweb.reactnativeviewshot.RNViewShotPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.gijoehosaphat.keepscreenon.KeepScreenOnPackage;
import org.reactnative.camera.RNCameraPackage;
import com.rctunderdark.NetworkManagerPackage;
import com.horcrux.svg.SvgPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNFSPackage(),
            new MapsPackage(),
            new RNThumbnailPackage(),
            new SplashScreenPackage(),
            new RNFetchBlobPackage(),
            new RNViewShotPackage(),
            new VectorIconsPackage(),
            new KeepScreenOnPackage(),
            new RNCameraPackage(),
            new NetworkManagerPackage(),
            new SvgPackage(),
            new IopanReactPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
