// The basic Plotly distribution (bar / pie / scatter only) ships no type
// declarations. We only ever pass it to react-plotly.js's factory, which types
// it as `object`, so a minimal ambient module declaration is sufficient.
declare module 'plotly.js-basic-dist' {
  const Plotly: object
  export default Plotly
}
