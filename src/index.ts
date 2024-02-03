import { runCliApp } from './cli';
import { runDesktopApp } from './desktop';

if (process.argv.length > 2) {
  runCliApp();
} else {
  runDesktopApp();
}
