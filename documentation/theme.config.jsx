export default {
  logo: <span>ez-gantt</span>,
  project: {
    link: 'https://github.com/paul0lden/ez-gantt',
  },
  docsRepositoryBase: 'https://github.com/paul0lden/ez-gantt/tree/main/documentation/',
  useNextSeoProps() {
    return {
      titleTemplate: '%s – ez-gantt',
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="ez-gantt" />
      <meta property="og:description" content="Fast and easy to use react gantt chart" />
    </>
  ),
}