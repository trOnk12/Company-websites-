plugins { `java-library` }
dependencies {
  implementation(project(":pricing"))
  testImplementation(testFixtures(project(":pricing")))
}
