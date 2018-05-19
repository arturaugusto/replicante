// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'

import VuePaginate from 'vue-paginate'
Vue.use(VuePaginate)

import 'mint-ui/lib/style.css'

import { Tabbar, TabItem } from 'mint-ui';
Vue.component(Tabbar.name, Tabbar);
Vue.component(TabItem.name, TabItem);

import { TabContainer, TabContainerItem } from 'mint-ui';
Vue.component(TabContainer.name, TabContainer);
Vue.component(TabContainerItem.name, TabContainerItem);

import { Cell } from 'mint-ui';
Vue.component(Cell.name, Cell);

import { Button } from 'mint-ui';
Vue.component(Button.name, Button);

import { Swipe, SwipeItem } from 'mint-ui';
Vue.component(Swipe.name, Swipe);
Vue.component(SwipeItem.name, SwipeItem);

import { Field } from 'mint-ui';
Vue.component(Field.name, Field);

import { DatetimePicker } from 'mint-ui';
Vue.component(DatetimePicker.name, DatetimePicker);

import { Range } from 'mint-ui';
Vue.component(Range.name, Range);

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})
