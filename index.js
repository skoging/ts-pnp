function resolveModuleName(request, issuer, compilerOptions, moduleResolutionHost, parentResolver) {
  const pnp = require(`pnpapi`);

  const [, prefix = ``, packageName = ``, rest] = request.match(/^(!(?:.*!)+)?((?!\.{0,2}\/)(?:@[^\/]+\/)?[^\/]+)?(.*)/);

  const tryUnqualified = [];
  const failedLookupLocations = [];

  // First we try the resolution on "@types/package-name" starting from the project root
  if (packageName) {
    const typesPackagePath = `@types/${packageName.replace(/\//g, `__`).replace('@', '')}${rest}`;

    let unqualified;
    try {
      unqualified = pnp.resolveToUnqualified(typesPackagePath, issuer, {considerBuiltins: false});
    } catch (error) {}

    if (unqualified) {
      tryUnqualified.push(unqualified);

      // TypeScript checks whether the directory of the candidate is a directory
      // which may cause issues w/ zip loading (since the zip archive is still
      // reported as a file). To workaround this we add a trailing slash, which
      // causes TypeScript to assume the parent is a directory.
      if (moduleResolutionHost.directoryExists && moduleResolutionHost.directoryExists(unqualified))
        tryUnqualified.push(unqualified + `/`);
    }
  }

  // Then we try on "package-name", this time starting from the package that makes the request
  if (true) {
    const regularPackagePath = `${packageName || ``}${rest}`;

    let unqualified;
    try {
      unqualified = pnp.resolveToUnqualified(regularPackagePath, issuer, {considerBuiltins: false});
    } catch (error) {}

    if (unqualified) {
      tryUnqualified.push(unqualified);

      // TypeScript checks whether the directory of the candidate is a directory
      // which may cause issues w/ zip loading (since the zip archive is still
      // reported as a file). To workaround this we add a trailing slash, which
      // causes TypeScript to assume the parent is a directory.
      if (moduleResolutionHost.directoryExists && moduleResolutionHost.directoryExists(unqualified))
        tryUnqualified.push(unqualified + '/');
    }
  }

  for (const unqualified of tryUnqualified) {
    const finalResolution = parentResolver(unqualified, issuer, compilerOptions, moduleResolutionHost);

    if (finalResolution.resolvedModule || finalResolution.resolvedTypeReferenceDirective)
      return finalResolution;

    failedLookupLocations.push(...finalResolution.failedLookupLocations);
  }

  return {
    resolvedModule: undefined,
    resolvedTypeReferenceDirective: undefined,
    failedLookupLocations,
  };
}

module.exports.resolveModuleName = process.versions.pnp
  ? resolveModuleName
  : (moduleName, containingFile, compilerOptions, compilerHost, resolveModuleName) =>
      resolveModuleName(moduleName, containingFile, compilerOptions, compilerHost);
