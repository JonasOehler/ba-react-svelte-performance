# macOS GUI editors often start latexmk with a stripped-down PATH that
# excludes MacTeX's bin directory; add it if present so 'pdflatex' etc.
# resolve without hardcoding an absolute path (keeps this file portable
# across macOS/Windows/Linux).
if ($^O eq 'darwin') {
    my $texbin = '/Library/TeX/texbin';
    if (-d $texbin && $ENV{PATH} !~ /\Q$texbin\E/) {
        $ENV{PATH} = "$texbin:$ENV{PATH}";
    }
}

$pdflatex = 'pdflatex %O %S';
$biber    = 'biber %O %S';
$pdf_mode = 1;

add_cus_dep('nlo', 'nls', 0, 'makenlo2nls');
sub makenlo2nls {
    # List-form system() bypasses the shell entirely, so this works
    # regardless of OS quoting rules and of spaces in the path.
    return system('makeindex', "$_[0].nlo", '-s', 'nomencl.ist',
                   '-o', "$_[0].nls", '-t', "$_[0].nlg");
}
