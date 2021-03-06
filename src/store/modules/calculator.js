import { toPostfix, evalPostfix } from '@/utils'
import Vue from 'vue'

const emptyFraction = { numerator: '', denominator: '' }

const initialState = {
  fractions: [
    {...emptyFraction},
    {...emptyFraction}
  ],
  operators: [''],
  value: {...emptyFraction},
  error: undefined
}

const getters = {
  expressions: state => (state.fractions.map((fraction, index) => ({...fraction, operator: state.operators[index]}))),
  filled: state => !(!!state.fractions.filter(fraction => fraction.numerator === '' || fraction.denominator === '').length ||
                    !!state.operators.filter(operator => operator === '').length),
  toString: (state, getters) =>
    (getters.filled
      ? (state.fractions.map((fraction, index) => (
        `${fraction.numerator}/${fraction.denominator}${state.operators[index] ? ' ' + state.operators[index].split('').join(' ') : ''}`
      )))
      : [])
      .join(' ')
}

const actions = {
  addFraction: (context) => context.commit('addFraction'),
  updateFraction: (context, {index, data}) => {
    context.commit('updateFraction', {index, data})
    context.dispatch('calculate')
  },
  updateOperator: (context, {index, data}) => {
    context.commit('updateOperator', {index, data})
    context.dispatch('calculate')
  },
  calculate: (context) => {
    if (context.getters.filled) {
      try {
        let postfix = toPostfix(context.getters.toString)
        let value = evalPostfix(postfix).split('/')
        let fraction = { numerator: value[0], denominator: value[1] }
        if (isNaN(fraction.numerator) || isNaN(fraction.denominator)) {
          throw new Error('Невозможно высчитать это выражение (деление на 0)')
        }
        context.commit('setValue', fraction)
        context.commit('setError', {})
      } catch (e) {
        context.commit('setValue', emptyFraction)
        context.commit('setError', e)
      }
    }
  }
}

const mutations = {
  addFraction: (state) => {
    state.fractions.unshift({ ...emptyFraction })
    state.operators.unshift('')
  },
  updateFraction: (state, { index, data }) => {
    let fraction = state.fractions.find((fraction, fIndex) => index === fIndex)
    fraction.denominator = data.denominator
    fraction.numerator = data.numerator
  },
  updateOperator: (state, { index, data }) => {
    Vue.set(state.operators, index, data)
  },
  setValue: (state, fraction) => { state.value = fraction },
  setError: (state, error) => { state.error = error.message }
}

export default {
  namespaced: true,
  state: initialState,
  actions,
  mutations,
  getters
}
