// Le mockup copié utilise <style jsx> (styled-jsx de Next).
import 'react'
declare module 'react' {
  interface StyleHTMLAttributes<T> {
    jsx?: boolean
    global?: boolean
  }
}
