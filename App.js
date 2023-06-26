import React from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { Audio, Video } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { Camera } from 'expo-camera';

export default function App() {
  const [gravando, setGravacao] = React.useState(null);
  const [resultado, setResultado] = React.useState(null);

  async function iniciarGravacao() {
    try {
      console.log('Solicitando permissões..');
      const { granted: cameraGranted } = await Camera.requestPermissionsAsync();
      const { granted: audioGranted } = await Audio.requestPermissionsAsync();
      if (!cameraGranted || !audioGranted) {
        console.log('Permissões negadas');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Iniciando gravação..');
      const { uri, codec = 'mp4' } = await cameraRef.recordAsync({
        quality: Camera.Constants.VideoQuality['720p'],
        maxDuration: 60,
        mute: false,
      });
      setGravacao({ uri, codec });
      console.log('Gravação iniciada');
    } catch (erro) {
      console.error('Falha ao iniciar a gravação', erro);
    }
  }

  async function pararGravacao() {
    if (!gravando) {
      return;
    }

    try {
      await cameraRef.stopRecording();
      console.log('Gravação parada');
      const { uri, codec } = gravando;
      // If audio was recorded, merge it with the video
      if (codec === 'mp4') {
        const audio = await Audio.Sound.createAsync({ uri: uri });
        const video = await Video.createAsync({ uri: uri });
        const outputOptions = {
          container: Video.RECORDING_OPTIONS_PRESET_HIGH_QUALITY.container,
          codec: Video.RECORDING_OPTIONS_PRESET_HIGH_QUALITY.codec,
          bitrate: Video.RECORDING_OPTIONS_PRESET_HIGH_QUALITY.bitrate,
          audioChannels: 2,
          audioBitrate: 128000,
          audioSampleRate: 44100,
        };
        const output = `${Video.RECORDING_OPTIONS_PRESET_HIGH_QUALITY.name}.${Video.RECORDING_OPTIONS_PRESET_HIGH_QUALITY.container}`;
        await Video.mergeAsync([video, audio], output, outputOptions);
        setResultado({ uri: output, codec });
        console.log('Gravação processada, URI:', output);
      } else {
        setResultado({ uri, codec });
        console.log('Gravação parada, URI:', uri);
      }
    } catch (erro) {
      console.log('Falha ao parar a gravação:', erro);
    }
  }

  async function reproduzirGravacao() {
    if (!resultado || !resultado.uri) {
      console.log('Nenhuma gravação para reproduzir');
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: resultado.uri });
      await sound.playAsync();
      console.log('Reproduzindo gravação');
    } catch (erro) {
      console.log('Falha ao reproduzir a gravação:', erro);
    }
  }

  async function escolherGravacao() {
    let resultadoTemp = await DocumentPicker.getDocumentAsync({});
    setResultado(resultadoTemp);
    console.log(resultadoTemp);
  }

  const cameraRef = React.useRef(null);

  return (
    <View style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} type={Camera.Constants.Type.back} />
      <Button title='Iniciar Gravação' onPress={iniciarGravacao} />
      <Button title='Parar Gravação' onPress={pararGravacao} color='red' />
      <Button title='Reproduzir Gravação' onPress={reproduzirGravacao} color='green' />
      <Button title='Escolher Gravação' onPress={escolherGravacao} color='blue' />
      {resultado && resultado.uri && (
        <Video source={{ uri: resultado.uri }} style={styles.video} shouldPlay />
      )}
      {gravando && (
        <View style={styles.recordingIndicator}>
          <Text style={styles.recordingText}>Gravando...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    width: 300,
    height: 300,
  },
  video: {
    width: 300,
    height: 300,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'red',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  recordingText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
