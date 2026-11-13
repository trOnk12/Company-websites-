plugins { `java-library`; `java-test-fixtures` }
val scope = providers.gradleProperty("scope").getOrElse("implementation")
dependencies { add(scope, project(":money")) }
