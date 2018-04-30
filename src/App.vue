<template>
  <div id="app">

    <mt-navbar v-model="active" fixed>
      <mt-tab-item id="log">Log</mt-tab-item>
      <mt-tab-item id="camera">Camera</mt-tab-item>
      <mt-tab-item id="replication">Replication</mt-tab-item>
    </mt-navbar>

    <mt-tab-container v-model="active" :swipeable="false">

      <!-- Log -->
      <mt-tab-container-item id="log">
        <div
          v-for="log in logList"
          :id="log.id"
          :key="log.id"
          :title="log.id"
          class="log-item"
        >
          <mt-cell 
            :title="log.date"
          >
          </mt-cell>
          <img :src="log.url">
          <span class="log-actions">
            <mt-button size="small" type="danger" @click="removeLogHandler(log)">
              &times Remove
            </mt-button>
          </span>
        </div>
      </mt-tab-container-item>

      <!-- Camera -->

      <mt-tab-container-item id="camera">

        <br>
        <mt-button :type="!cam.enabled? 'primary' : 'default'" @click="camEnableHandler">
          <span v-if="!cam.enabled">Enable Camera</span>
          <span v-if="cam.enabled">Disable logging</span>
        </mt-button>

        </mt-switch>
        <figure>
          <video id="video" ref="video"></video>
          <!--<figcaption>Live Video</figcaption>-->
        </figure>
        <mt-cell 
          title="Sensibility"
          class="sensibility-cell"
        >
          <mt-range
            v-model="cam.sensibility"
            :min="800"
            :max="cam.sensibilityMax"
            :step="10"
            :bar-height="2"
          >
            <span slot="start">
            </span>
          </mt-range>
        </mt-cell>
        <br>        
      </mt-tab-container-item>

      <!-- Replication -->

      <mt-tab-container-item id="replication">
        <form id="replication-form">
          <mt-field label="address" placeholder="Input server address" type="url" v-model="replication.address"></mt-field>
          <mt-field label="username" placeholder="Input username" v-model="replication.username"></mt-field>
          <mt-field label="password" placeholder="Input password" type="password" v-model="replication.password"></mt-field>

          <mt-button type="primary" @click="loginHandler">Login</mt-button>
        </form>
      </mt-tab-container-item>


    </mt-tab-container>
  </div>
</template>

<script>
import { MessageBox } from 'mint-ui'

var PouchDB = require('pouchdb').default
var DiffCamEngine = require('./diff-cam-engine.js')
export default {
  name: 'App',
  data () {
    return {
      db: null,
      remoteDB: null,
      syncHandler: null,
      active: 'replication',
      cam: {
        enabled: false,
        sensibility: 900,
        sensibilityMax: 1000
      },
      camEngine: DiffCamEngine,
      replication: {
        address: '',
        username: '',
        password: ''
      },
      logs: []
    }
  },
  created () {
    this.db = new PouchDB('replicante', {adapter: 'idb'})
    this.db.changes({
      since: 'now',
      live: true,
      include_docs: true
    }).on('change', (change) => {
      this.getLogs(!change.deleted)
    })

  },
  mounted () {
    this.getLogs()
  },
  methods: {
    loginHandler () {
      this.remoteDB = new PouchDB(this.replication.address)
      this.syncHandler = PouchDB.sync(this.db, this.remoteDB, {
        live: true,
        retry: true
      }).on('change', (info) => {
        console.log(info)
        //this.getLogs()
      })

    },
    removeLogHandler (log) {
      MessageBox({
        title: 'Notice',
        message: 'Remove this item?',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Confirm'
      }).then(action => {
        if (action === 'confirm') {
          this.removeLogItem(log)
        }
      })
      .catch((e) => {
        //
      })
    },
    removeLogItem (log) {
      this.db.get(log.id).then((doc) => {
        doc._deleted = true
        delete this.logs[doc._id]
        return this.db.put(doc)
      }).then((result) => {
        //
      }).catch((err) => {
        console.log(err);
      })

    },
    setLogItem (doc, scroll) {
      this.$set(this.logs, doc._id, {})
      this.$set(this.logs[doc._id], 'id', doc._id)
      this.$set(this.logs[doc._id], 'date', doc.date)
      this.$set(this.logs[doc._id], 'timestamp', doc.timestamp)
      if (doc._attachments) {
        var blob = doc._attachments['capture.png'].data
        var url = URL.createObjectURL(blob)
        this.$set(
          this.logs[doc._id],
          'url',
          url
        )
      } else {
        this.$set(this.logs[doc._id], 'url', null)
      }
      if (this.active === 'log' && scroll) {
        this.$nextTick(() => {
          window.setTimeout(() => {
            window.scrollTo({top:1e9})
          }, 10)
        })
      }

    },
    getLogs (scroll) {
      scroll = scroll === undefined ? true : scroll
      this.db.allDocs({
        include_docs: true,
        attachments: true,
        binary: true,
        descending: true
      })
      .then((result) => {
        result.rows.filter((row) => {
          return (!row.doc.timestamp ? true :
            row.doc.timestamp > Date.now()-1000*3600*2) &&
            !row._deleted
          ;
        })
        .map((row) => {
          var doc = row.doc
          this.setLogItem(doc, scroll)
        })
      })
    },
    camEnableHandler () {
      this.cam.enabled = !this.cam.enabled
      if (this.cam.enabled) {
        this.camEngine.init({
          video: this.$refs.video,
          motionCanvas: null,
          initSuccessCallback: this.initSuccess,
          initErrorCallback: this.initError,
          captureCallback: this.capture
        })
      } else {
        this.cam.enabled = false
        this.camEngine.stop()
        //this.stopCapture()
      }

    },
    initSuccess () {
      this.camEngine.start()
    },
    initError () {
      alert('Something went wrong.')
    },
    capture (payload) {
      if (payload.score > this.cam.sensibilityMax - this.cam.sensibility) {
        //console.log(payload.getURL())
        this.db.post({
          type: 'imageCapture',
          timestamp: Date.now(),
          date: Date(),
          _attachments: {
            'capture.png': {
              content_type: 'image/png',
              data: payload.getURL().split(',')[1]
            }
          }
        }).then(() => {
          //console.log('gravado')
        })

      }
    },
    stopCapture () {
      navigator.mediaDevices.getUserMedia({audio:true,video:true})
      .then(stream => {
          window.localStream = stream;
      })
      .catch( (err) =>{
          console.log(err);
      });
      localStream.getTracks().forEach( (track) => {
        track.stop();
      });
      localStream.getAudioTracks()[0].stop();
      localStream.getVideoTracks()[0].stop();
    }
  },
  computed: {
    logList () {
      var res = Object.keys(this.logs).map((item) => {
        var logItem = this.logs[item]
        return {
          id: logItem.id,
          url: logItem.url,
          date: logItem.date
        }
      })
      return res
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding-top: 60px;
}
.mint-tab-item-label {
  font-size: 16px;
}
.log-item {
  margin: 6px;
}
#video {
  background: black;
  width: 100%;
}

.mt-range {
  width: 100%;
}
.sensibility-cell .mint-cell-value {
  flex: 4;
  position: relative;
}

</style>
