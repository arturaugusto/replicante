<template>
  <div id="app">

    <mt-tabbar v-model="active" fixed>
      <mt-tab-item id="log">
        <svg slot="icon" :fill=" active === 'log' ? '#26a2ff' : 'black'" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M8 21c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM8 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 24c-1.67 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.33-3-3-3zm6 5h28v-4H14v4zm0-12h28v-4H14v4zm0-16v4h28v-4H14z"/></svg>
        Log
      </mt-tab-item>
      <mt-tab-item id="camera">
        <svg slot="icon" :fill=" active === 'camera' ? '#26a2ff' : 'black'" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="6.4"/><path d="M18 4l-3.66 4H8c-2.21 0-4 1.79-4 4v24c0 2.21 1.79 4 4 4h32c2.21 0 4-1.79 4-4V12c0-2.21-1.79-4-4-4h-6.34L30 4H18zm6 30c-5.52 0-10-4.48-10-10s4.48-10 10-10 10 4.48 10 10-4.48 10-10 10z"/></svg>
        Camera
      </mt-tab-item>
      <mt-tab-item id="replication">
        <svg slot="icon" :fill=" active === 'replication' ? '#26a2ff' : 'black'" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M24 8V2l-8 8 8 8v-6c6.63 0 12 5.37 12 12 0 2.03-.51 3.93-1.39 5.61l2.92 2.92C39.08 30.05 40 27.14 40 24c0-8.84-7.16-16-16-16zm0 28c-6.63 0-12-5.37-12-12 0-2.03.51-3.93 1.39-5.61l-2.92-2.92C8.92 17.95 8 20.86 8 24c0 8.84 7.16 16 16 16v6l8-8-8-8v6z"/></svg>
        Sync
      </mt-tab-item>
    </mt-tabbar>

    <mt-tab-container v-model="active" :swipeable="false">

      <mt-tab-container-item id="log" ref="logContainer">
        <!-- Log -->
        <mt-cell 
          v-if="logs && !logs.length"
          title="No logs"
          label="configure your camera to start logging"
        >
        </mt-cell>
        
        <paginate-links
        v-if="logs.length"
          for="logs"
          :container="{
            state: paginate.logs,
            el: $refs.logContainer
          }"
          :limit="4"
          :show-step-links="true"
        />

        <paginate
          name="logs"
          :list="logs"
          :per="10"
          :container="this"
        >
          <div
            v-for="log in paginated('logs')"
            :id="log._id"
            :key="log._id"
            class="log-item"
          >
            <mt-cell 
              :title="log.date"
              :label="log._id"
            >
            </mt-cell>
            <img :src="log.url" class="widthSet">
            <div class="log-actions">
              <mt-button size="small" type="danger" @click="removeLogHandler(log)">
                &times Remove
              </mt-button>
            </div>
          </div>
        </paginate>

        <paginate-links
        v-if="logs.length"
          for="logs"
          :container="{
            state: paginate.logs,
            el: $refs.logContainer
          }"
          :limit="4"
          :show-step-links="true"
        />

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
        <form v-if="!logged" id="replication-form" @change="replicationFormHandler">
          <mt-field label="address" placeholder="Input server address" type="url" v-model="replication.address"></mt-field>
          <mt-field label="db name" placeholder="Input database name" v-model="replication.dbname"></mt-field>
          <mt-field label="username" placeholder="Input username" v-model="replication.username"></mt-field>
          <mt-field label="password" placeholder="Input password" type="password" v-model="replication.password"></mt-field>

          <mt-button type="primary" @click="loginHandler">Login</mt-button>
        </form>

        <span v-if="logged">
          <mt-cell 
            title="You are logged in"
            :label="'replicating to '+replication.address+'/'+replication.dbname"
          >
          </mt-cell>
          <mt-button type="primary" @click="logoutfHandler">Logout</mt-button>
        </span>

        <br>
        <br>

        <mt-cell 
          v-if="getLogsSince"
          title="Retrieving logs from remote since:"
          :label="getLogsSince.toString()"
        >
        </mt-cell>
        <mt-button type="default" @click="opengetLogsSincePicker">Set starting date</mt-button>

        <mt-datetime-picker
          ref="getLogsSincePicker"
          type="datetime"
          confirmText="Set date time"
          cancelText="Cancel"
          @confirm="setLogsSince"
          @cancel="rollBackLogsSince"
          v-model="getLogsSince">
        </mt-datetime-picker>
      </mt-tab-container-item>


    </mt-tab-container>
  </div>
</template>

<script>
function makeid() {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function shallowClone(obj) {
  var res = {}
  Object.keys(obj).map((k) => {
    if (typeof(obj[k] !== 'object')) {
      res[k] = obj[k]
    }
  })
  return res
}

import { MessageBox, Toast } from 'mint-ui'
import moment from 'moment'
window.moment = moment

var PouchDB = require('pouchdb').default
PouchDB.plugin(require('pouchdb-authentication').default)

var DiffCamEngine = require('./diff-cam-engine.js')

var id
if (!localStorage.getItem('replicaId')) {
  id = makeid()
  localStorage.setItem('replicaId', id)
} else {
  id = localStorage.getItem('replicaId')
}

var replication = {
  address: '',
  dbname: '',
  username: ''
}
var replicationString = localStorage.getItem('replicationData')
if (replicationString) {
  replication = JSON.parse(replicationString)
}
replication.password = ''

export default {
  name: 'App',
  watch: {
    active (tab) {
    }
  },
  data () {
    return {
      replicaId: id,
      db: null,
      remoteDB: null,
      logged: null,
      syncHandler: null,
      active: 'log',
      cam: {
        enabled: false,
        sensibility: 900,
        sensibilityMax: 1000
      },
      camEngine: DiffCamEngine,
      replication: replication,
      logs: [],
      paginate: ['logs'],
      getLogsSince: null,
      getLogsSinceLast: null
    }
  },
  created () {
    this.db = new PouchDB('replicante', {adapter: 'idb'})
    this.db.changes({
      since: 'now',
      live: true,
      include_docs: true
    }).on('change', (change) => {
      console.log(change)
      this.getLogs()
    })

  },
  mounted () {
    if (this.replication && this.replication.address) {
      this.remoteDB = new PouchDB(this.dbAddress, {adapter: 'http'})
      this.remoteDB.getSession( (err, response) => {

        // Sometimes Couchdb returns a userCtx
        // without a user. In this case, logged out
        if (response && response.userCtx) {
          if (!response.userCtx.name) {
            this.logged = false
            return
          }
        }

        if (err) {
          this.logged = false
        } else {
          this.logged = true
          this.checkForFilterDesignDoc()
        }

      })
    }
    
    var getLogsSinceTimestamp = localStorage.getItem('getLogsSinceTimestamp')
    if (!getLogsSinceTimestamp) {
      this.getLogsSince = new Date()
      localStorage.setItem('getLogsSinceTimestamp', this.getLogsSince.getTime())
    } else {
      this.getLogsSince = moment(parseInt(getLogsSinceTimestamp)).toDate()
    }
    this.getLogs()

  },
  methods: {
    rollBackLogsSince () {
      this.getLogsSince = this.getLogsSinceLast
    },
    setLogsSince () {
      localStorage.setItem('getLogsSinceTimestamp', this.getLogsSince.getTime())
      this.setReplication()
    },
    opengetLogsSincePicker () {
      this.getLogsSinceLast = this.getLogsSince
      this.$refs.getLogsSincePicker.open()
    },
    setReplication () {
      if (this.syncHandler) {
        this.syncHandler.cancel()
      }

      this.syncHandler = PouchDB.sync(this.db, this.remoteDB, {
        live: true,
        retry: true,
        filter: 'app/logFilter',
        query_params: {startDatetime: this.getLogsSince.getTime()}        
      }).on('change', (info) => {
        console.log(info)
      })

    },
    checkForFilterDesignDoc () {
      this.remoteDB.get('_design/app').then((response) => {
        this.setReplication()
      }).catch((err) => {
        if (err.name === 'not_found') {
          return this.remoteDB.put({
            _id: '_design/app',
            filters: {
              logFilter: (function (doc, req) {
                return doc._id === '_design/app' || doc.timestamp >= parseInt(req.query.startDatetime);
              }).toString()
            }
          })
        }
      })
    },
    logoutfHandler () {
      this.remoteDB.logout((err, response) => {
        if (err) {
          console.log(err)
        } else {
          this.logged = false
        }
      })
    },
    replicationFormHandler () {
      var formData = shallowClone(this.replication)
      delete formData.password
      localStorage.setItem('replicationData', JSON.stringify(formData))
    },
    loginHandler (evt) {
      evt.preventDefault()
      this.remoteDB = new PouchDB(this.dbAddress, {adapter: 'http'})

      this.remoteDB.login(this.replication.username, this.replication.password)
      .then((response) => {
        this.logged = true
        this.checkForFilterDesignDoc()
      })
      .catch((err) => {
        console.log(err)
        Toast({
          message: 'Error: ' + (err.message || err.name)
        })
      })
      .finally(() => {
        
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
      this.db.get(log._id).then((doc) => {
        doc._deleted = true
        return this.db.put(doc)
      }).then((result) => {
        //
      }).catch((err) => {
        console.log(err);
      })

    },
    getLogs () {
      this.db.allDocs({
        include_docs: true,
        attachments: true,
        binary: true,
        descending: true
      })
      .then((result) => {
        var res = []
        result.rows.filter((row) => {
          return !row.deleted
        })
        .map((row) => {
          var doc = row.doc
          if (doc._id === '_design/app') return

          if (doc._attachments) {
            var blob = doc._attachments['capture.png'].data
            var url = URL.createObjectURL(blob)
            doc.url = url
          } else {
            doc.url = null
          }
          res.push(doc)
        })
        this.logs = res
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
        this.db.put({
          _id: this.replicaId+'_'+Date.now(),
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
    dbAddress () {
      if (!this.replication) return null
      return this.replication.address +'/'+ this.replication.dbname
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
  padding-bottom: 60px;
}
.mint-navbar {
  background: #eaf4f7b5;
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




ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

.paginate-links.logs {
  user-select: none;
}

ul.paginate-links.logs li {
  cursor: pointer;
}

ul.paginate-links.logs li.active {
  font-weight: bold;
}
ul.paginate-links.logs li.disabled {
  color: #ccc;
  cursor: no-drop;
}

.widthSet {
  max-width: 90%;
}

</style>
